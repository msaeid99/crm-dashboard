/** @odoo-module */

import { Component, onWillStart, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";

export class KpiCard extends Component {
    static template = "crm_dashboard_extension.KpiCard";
}

export class DashboardChart extends Component {
    static template = "crm_dashboard_extension.DashboardChart";

    maxValue() {
        return Math.max(...this.props.rows.map((row) => row.value), 1);
    }

    barWidth(value) {
        return Math.max((value / this.maxValue()) * 100, value ? 4 : 0);
    }
}

export class DashboardTable extends Component {
    static template = "crm_dashboard_extension.DashboardTable";

    format(value, column) {
        if (column.type === "currency") {
            return `${this.props.currency} ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        }
        if (column.type === "percent") {
            return `${Number(value || 0).toFixed(2)}%`;
        }
        return Number.isFinite(Number(value)) ? Number(value).toLocaleString() : (value || "—");
    }
}

export class CrmDashboard extends Component {
    static template = "crm_dashboard_extension.CrmDashboard";
    static components = { KpiCard, DashboardChart, DashboardTable };

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.labels = {
            title: _t("CRM Dashboard"),
            subtitle: _t("Monitor pipeline health, revenue and team performance."),
            allTime: _t("All time"),
            last7: _t("Last 7 days"),
            last30: _t("Last 30 days"),
            last90: _t("Last 90 days"),
            allTeams: _t("All teams"),
            refresh: _t("Refresh"),
            loading: _t("Loading dashboard..."),
            unavailable: _t("Dashboard data could not be loaded."),
            pipelineStage: _t("Pipeline by Stage"),
            leadSources: _t("Lead Sources"),
            pipelineAnalysis: _t("Pipeline Analysis"),
            activitiesOverview: _t("Activities Overview"),
            salespersonPerformance: _t("Salesperson Performance"),
            topOpportunities: _t("Top Opportunities"),
            opportunityAging: _t("Opportunity Aging"),
            leadSourceAnalysis: _t("Lead Source Analysis"),
            noData: _t("No data available."),
            stage: _t("Stage"),
            opportunities: _t("Opportunities"),
            expectedRevenue: _t("Expected Revenue"),
            metric: _t("Metric"),
            count: _t("Count"),
            salesperson: _t("Salesperson"),
            won: _t("Won"),
            lost: _t("Lost"),
            conversionRate: _t("Conversion Rate"),
            age: _t("Age"),
            opportunity: _t("Opportunity"),
            customer: _t("Customer"),
            probability: _t("Probability"),
            ageDays: _t("Age (days)"),
            source: _t("Source"),
            totalActivities: _t("Total Activities"),
            completedActivities: _t("Completed Activities"),
            pendingActivities: _t("Pending Activities"),
            overdueActivities: _t("Overdue Activities"),
            totalLeads: _t("Total Leads"),
            totalOpportunities: _t("Total Opportunities"),
            expectedRevenue: _t("Expected Revenue"),
            wonOpportunities: _t("Won Opportunities"),
            lostOpportunities: _t("Lost Opportunities"),
            conversionRate: _t("Conversion Rate"),
            age0to30: _t("0-30 days"),
            age30to60: _t("30-60 days"),
            age60plus: _t("60+ days"),
        };
        if ((this.env.services.user?.context?.lang || "").startsWith("ar")) {
            Object.assign(this.labels, {
                title: "لوحة تحكم CRM",
                subtitle: "تابع حالة خط المبيعات والإيرادات وأداء الفريق.",
                allTime: "كل الفترات",
                last7: "آخر 7 أيام",
                last30: "آخر 30 يومًا",
                last90: "آخر 90 يومًا",
                allTeams: "كل الفرق",
                refresh: "تحديث",
                loading: "جارٍ تحميل لوحة التحكم...",
                unavailable: "تعذر تحميل بيانات لوحة التحكم.",
                pipelineStage: "خط المبيعات حسب المرحلة",
                leadSources: "مصادر العملاء المحتملين",
                pipelineAnalysis: "تحليل خط المبيعات",
                activitiesOverview: "ملخص الأنشطة",
                salespersonPerformance: "أداء مندوبي المبيعات",
                topOpportunities: "أعلى الفرص",
                opportunityAging: "عمر الفرص",
                leadSourceAnalysis: "تحليل مصادر العملاء",
                noData: "لا توجد بيانات.",
                stage: "المرحلة",
                opportunities: "الفرص",
                expectedRevenue: "الإيراد المتوقع",
                metric: "المؤشر",
                count: "العدد",
                salesperson: "مندوب المبيعات",
                won: "رابحة",
                lost: "خاسرة",
                conversionRate: "معدل التحويل",
                age: "العمر",
                opportunity: "الفرصة",
                customer: "العميل",
                probability: "الاحتمالية",
                ageDays: "العمر (بالأيام)",
                source: "المصدر",
                totalActivities: "إجمالي الأنشطة",
                completedActivities: "الأنشطة المكتملة",
                pendingActivities: "الأنشطة المعلقة",
                overdueActivities: "الأنشطة المتأخرة",
                totalLeads: "إجمالي العملاء المحتملين",
                totalOpportunities: "إجمالي الفرص",
                wonOpportunities: "الفرص الرابحة",
                lostOpportunities: "الفرص الخاسرة",
                age0to30: "من 0 إلى 30 يومًا",
                age30to60: "من 30 إلى 60 يومًا",
                age60plus: "أكثر من 60 يومًا",
            });
        }
        this.columns = {
            pipeline: [
                { key: "stage_name", label: this.labels.stage },
                { key: "opportunity_count", label: this.labels.opportunities, type: "integer" },
                { key: "expected_revenue", label: this.labels.expectedRevenue, type: "currency" },
            ],
            activities: [
                { key: "label", label: this.labels.metric },
                { key: "value", label: this.labels.count, type: "integer" },
            ],
            salesperson: [
                { key: "user_name", label: this.labels.salesperson },
                { key: "opportunity_count", label: this.labels.opportunities, type: "integer" },
                { key: "expected_revenue", label: this.labels.expectedRevenue, type: "currency" },
                { key: "won_opportunities", label: this.labels.won, type: "integer" },
                { key: "lost_opportunities", label: this.labels.lost, type: "integer" },
                { key: "conversion_rate", label: this.labels.conversionRate, type: "percent" },
            ],
            aging: [
                { key: "label", label: this.labels.age },
                { key: "opportunity_count", label: this.labels.opportunities, type: "integer" },
                { key: "expected_revenue", label: this.labels.expectedRevenue, type: "currency" },
            ],
            topOpportunities: [
                { key: "name", label: this.labels.opportunity },
                { key: "customer", label: this.labels.customer },
                { key: "salesperson", label: this.labels.salesperson },
                { key: "stage", label: this.labels.stage },
                { key: "expected_revenue", label: this.labels.expectedRevenue, type: "currency" },
                { key: "probability", label: this.labels.probability, type: "percent" },
                { key: "age_days", label: this.labels.ageDays, type: "integer" },
            ],
            source: [
                { key: "source_name", label: this.labels.source },
                { key: "opportunity_count", label: this.labels.opportunities, type: "integer" },
                { key: "expected_revenue", label: this.labels.expectedRevenue, type: "currency" },
            ],
        };
        this.state = useState({
            loading: true,
            error: false,
            data: null,
            filters: { dateRange: "all", teamId: false },
        });
        onWillStart(() => this.loadDashboard());
    }

    async loadDashboard() {
        try {
            this.state.data = await this.orm.call("crm.dashboard", "get_dashboard_data", [
                this.state.filters.dateRange,
                this.state.filters.teamId || false,
            ]);
        } catch (error) {
            this.state.error = true;
            this.notification.add("Unable to load CRM dashboard data.", { type: "danger" });
            throw error;
        } finally {
            this.state.loading = false;
        }
    }

    refresh() {
        this.state.loading = true;
        this.state.error = false;
        return this.loadDashboard();
    }

    async onDateRangeChange(ev) {
        this.state.filters.dateRange = ev.target.value;
        await this.refresh();
    }

    async onTeamChange(ev) {
        this.state.filters.teamId = ev.target.value ? Number(ev.target.value) : false;
        await this.refresh();
    }

    chartRows(rows, labelKey, valueKey) {
        return (rows || []).map((row) => ({ label: this.localizedText(row[labelKey]), value: row[valueKey] || 0 }));
    }

    activityRows(activities) {
        return [
            { label: this.labels.totalActivities, value: activities.total },
            { label: this.labels.completedActivities, value: activities.completed },
            { label: this.labels.pendingActivities, value: activities.pending },
            { label: this.labels.overdueActivities, value: activities.overdue },
        ];
    }

    localizedText(value) {
        if ((this.env.services.user?.context?.lang || "").startsWith("ar")) {
            return { Undefined: "غير محدد", Unassigned: "غير مُسند" }[value] || value;
        }
        return value;
    }

    sourceRows() {
        return (this.state.data.source || []).map((row) => ({
            ...row,
            source_name: this.localizedText(row.source_name),
        }));
    }

    localizedKpis() {
        const labels = {
            total_leads: this.labels.totalLeads,
            total_opportunities: this.labels.totalOpportunities,
            expected_revenue: this.labels.expectedRevenue,
            won_opportunities: this.labels.wonOpportunities,
            lost_opportunities: this.labels.lostOpportunities,
            conversion_rate: this.labels.conversionRate,
        };
        return (this.state.data.kpis || []).map((kpi) => ({ ...kpi, label: labels[kpi.key] || kpi.label }));
    }

    localizedAging() {
        const labels = [this.labels.age0to30, this.labels.age30to60, this.labels.age60plus];
        return (this.state.data.aging || []).map((row, index) => ({ ...row, label: labels[index] || row.label }));
    }
}

registry.category("actions").add("crm_dashboard_extension.dashboard", CrmDashboard);
