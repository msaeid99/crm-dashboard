{
    "name": "CRM Dashboard Extension",
    "summary": "Professional dashboard for the existing CRM application",
    "version": "17.0.1.0.2",
    "category": "Sales/CRM",
    "author": "Custom",
    "license": "LGPL-3",
    "depends": ["crm", "web"],
    "data": [
        "security/ir.model.access.csv",
        "views/crm_dashboard_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "crm_dashboard_extension/static/src/js/crm_dashboard.js",
            "crm_dashboard_extension/static/src/xml/crm_dashboard.xml",
            "crm_dashboard_extension/static/src/scss/crm_dashboard.scss",
        ],
    },
    "installable": True,
    "application": False,
}
