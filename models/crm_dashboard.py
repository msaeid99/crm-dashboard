from datetime import date, timedelta

from odoo import _, api, fields, models


class CrmDashboard(models.AbstractModel):
    """Read-only dashboard service using the current user's ORM permissions."""

    _name = "crm.dashboard"
    _description = "CRM Dashboard Data Service"

    @api.model
    def get_dashboard_data(self, date_range="all", team_id=False):
        lead_model = self.env["crm.lead"].with_context(active_test=False)
        opportunity_domain = [("type", "=", "opportunity")]
        lead_domain = [("type", "=", "lead")]
        if date_range in {"7", "30", "90"}:
            since = fields.Datetime.now() - timedelta(days=int(date_range))
            date_domain = [("create_date", ">=", fields.Datetime.to_string(since))]
            opportunity_domain += date_domain
            lead_domain += date_domain
        if team_id:
            opportunity_domain.append(("team_id", "=", int(team_id)))
            lead_domain.append(("team_id", "=", int(team_id)))

        total_leads = lead_model.search_count(lead_domain)
        total_opportunities = lead_model.search_count(opportunity_domain)
        expected_revenue = self._sum_expected_revenue(lead_model, opportunity_domain)

        won_stage_ids = self.env["crm.stage"].search([("is_won", "=", True)]).ids
        won_domain = opportunity_domain + [
            "|",
            ("stage_id", "in", won_stage_ids),
            ("probability", "=", 100),
        ]
        lost_domain = opportunity_domain + [("active", "=", False)]
        won_opportunities = lead_model.search_count(won_domain)
        lost_opportunities = lead_model.search_count(lost_domain)

        pipeline = self._pipeline(lead_model, opportunity_domain)
        salesperson = self._salesperson_performance(
            lead_model, opportunity_domain, won_stage_ids
        )
        source = self._source_analysis(lead_model, opportunity_domain)
        activities = self._activities_overview()
        aging = self._aging(lead_model, opportunity_domain)
        top_opportunities = self._top_opportunities(lead_model, opportunity_domain)
        teams = [
            {"id": team.id, "name": team.name}
            for team in self.env["crm.team"].search([], order="name")
        ]

        return {
            "currency_symbol": self.env.company.currency_id.symbol or "",
            "kpis": [
                {"key": "total_leads", "label": _("Total Leads"), "value": total_leads, "format": "integer"},
                {"key": "total_opportunities", "label": _("Total Opportunities"), "value": total_opportunities, "format": "integer"},
                {"key": "expected_revenue", "label": _("Expected Revenue"), "value": expected_revenue, "format": "currency"},
                {"key": "won_opportunities", "label": _("Won Opportunities"), "value": won_opportunities, "format": "integer"},
                {"key": "lost_opportunities", "label": _("Lost Opportunities"), "value": lost_opportunities, "format": "integer"},
                {"key": "conversion_rate", "label": _("Conversion Rate"), "value": self._percentage(won_opportunities, total_opportunities), "format": "percent"},
            ],
            "pipeline": pipeline,
            "salesperson": salesperson,
            "source": source,
            "activities": activities,
            "aging": aging,
            "top_opportunities": top_opportunities,
            "teams": teams,
        }

    @staticmethod
    def _percentage(numerator, denominator):
        return round((numerator / denominator) * 100, 2) if denominator else 0.0

    @staticmethod
    def _group_sum(group, field):
        return group.get(f"{field}_sum", group.get(field, 0.0)) or 0.0

    @staticmethod
    def _sum_expected_revenue(model, domain):
        result = model.read_group(domain, ["expected_revenue:sum"], [])
        return CrmDashboard._group_sum(result[0], "expected_revenue") if result else 0.0

    def _pipeline(self, model, domain):
        groups = model.read_group(
            domain,
            ["stage_id", "expected_revenue:sum"],
            ["stage_id"],
            lazy=False,
        )
        return [
            {
                "stage_name": group["stage_id"][1] if group.get("stage_id") else _("Undefined"),
                "opportunity_count": group.get("__count", 0),
                "expected_revenue": self._group_sum(group, "expected_revenue"),
            }
            for group in groups
        ]

    def _salesperson_performance(self, model, domain, won_stage_ids):
        groups = model.read_group(
            domain, ["user_id", "expected_revenue:sum"], ["user_id"], lazy=False
        )
        rows = []
        for group in groups:
            user_value = group.get("user_id")
            user_id = user_value[0] if user_value else False
            user_name = user_value[1] if user_value else _("Unassigned")
            user_domain = domain + [("user_id", "=", user_id)]
            won_domain = user_domain + [
                "|",
                ("stage_id", "in", won_stage_ids),
                ("probability", "=", 100),
            ]
            lost_domain = user_domain + [("active", "=", False)]
            rows.append(
                {
                    "user_name": user_name,
                    "opportunity_count": group.get("__count", 0),
                    "expected_revenue": self._group_sum(group, "expected_revenue"),
                    "won_opportunities": model.search_count(won_domain),
                    "lost_opportunities": model.search_count(lost_domain),
                    "conversion_rate": self._percentage(
                        model.search_count(won_domain), group.get("__count", 0)
                    ),
                }
            )
        return rows

    @staticmethod
    def _source_analysis(model, domain):
        groups = model.read_group(
            domain, ["source_id", "expected_revenue:sum"], ["source_id"], lazy=False
        )
        return [
            {
                "source_name": group["source_id"][1] if group.get("source_id") else _("Undefined"),
                "opportunity_count": group.get("__count", 0),
                "expected_revenue": CrmDashboard._group_sum(group, "expected_revenue"),
            }
            for group in groups
        ]

    def _activities_overview(self):
        activity_model = self.env["mail.activity"]
        domain = [("res_model", "=", "crm.lead")]
        activities = activity_model.search(domain)
        total = len(activities)
        completed = sum(activity.state == "done" for activity in activities)
        pending = sum(activity.state != "done" for activity in activities)
        overdue = sum(activity.state == "overdue" for activity in activities)
        return {
            "total": total,
            "completed": completed,
            "pending": pending,
            "overdue": overdue,
        }

    @staticmethod
    def _top_opportunities(model, domain):
        opportunities = model.search(domain, order="expected_revenue desc, create_date desc", limit=10)
        now = fields.Datetime.now()
        rows = []
        for opportunity in opportunities:
            created = fields.Datetime.to_datetime(opportunity.create_date)
            rows.append(
                {
                    "name": opportunity.name,
                    "customer": opportunity.partner_id.name or _("—"),
                    "salesperson": opportunity.user_id.name or _("Unassigned"),
                    "stage": opportunity.stage_id.name or _("Undefined"),
                    "expected_revenue": opportunity.expected_revenue or 0.0,
                    "probability": opportunity.probability or 0.0,
                    "age_days": max((now - created).days, 0),
                }
            )
        return rows

    @staticmethod
    def _aging(model, domain):
        now = fields.Datetime.now()
        boundaries = {
            "0-30 days": now - timedelta(days=30),
            "30-60 days": now - timedelta(days=60),
        }
        rows = {
            "0-30 days": {"label": _("0-30 days"), "opportunity_count": 0, "expected_revenue": 0.0},
            "30-60 days": {"label": _("30-60 days"), "opportunity_count": 0, "expected_revenue": 0.0},
            "60+ days": {"label": _("60+ days"), "opportunity_count": 0, "expected_revenue": 0.0},
        }
        opportunities = model.search(domain)
        for opportunity in opportunities:
            created = fields.Datetime.to_datetime(opportunity.create_date)
            if created >= boundaries["0-30 days"]:
                bucket = "0-30 days"
            elif created >= boundaries["30-60 days"]:
                bucket = "30-60 days"
            else:
                bucket = "60+ days"
            rows[bucket]["opportunity_count"] += 1
            rows[bucket]["expected_revenue"] += opportunity.expected_revenue or 0.0
        return list(rows.values())
