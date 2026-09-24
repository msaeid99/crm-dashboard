# CRM Dashboard Extension

Read-only OWL dashboard for the existing Odoo 17 Community CRM application. It adds **CRM → Dashboard** and uses only Odoo ORM methods; it does not create a CRM application or modify Odoo core files.

The dashboard includes KPI cards, pipeline/stage analysis, salesperson performance, lead sources, activity status, opportunity aging, date-range filtering, Sales Team filtering, and a Top Opportunities table.

## Development installation

1. Copy or clone this directory into an addons path, for example `/mnt/extra-addons/crm_dashboard_extension`.
2. Ensure the addons path is present in `odoo.conf`:

   ```ini
   addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons
   ```

3. Restart Odoo, open Apps, activate developer mode, click **Update Apps List**, and install **CRM Dashboard Extension**.
4. Open **CRM → Dashboard**.

## GitHub upload

```bash
git init
git add crm_dashboard_extension
git commit -m "Add CRM dashboard extension"
git branch -M main
git remote add origin https://github.com/<owner>/<repository>.git
git push -u origin main
```

## Server deployment

```bash
cd /mnt/extra-addons
git clone https://github.com/<owner>/<repository>.git crm-dashboard-repository
cp -R crm-dashboard-repository/crm_dashboard_extension /mnt/extra-addons/
docker restart tahcom-community-odoo
```

Then update the Apps List and install the module from Apps. To upgrade it from the container:

```bash
docker exec -it tahcom-community-odoo odoo -u crm_dashboard_extension -d Tahcom --stop-after-init
docker restart tahcom-community-odoo
```

Adjust the container name if the deployment uses a different Docker Compose service/container name.

## Testing checklist

### Installation

- [ ] Install on Odoo 17 Community without manifest errors.
- [ ] Confirm `crm` and `web` are installed and no dependency is missing.
- [ ] Confirm there are no missing XML IDs, especially `crm.crm_menu_root` and `model_crm_dashboard`.
- [ ] Confirm the module is not marked as an application.

### UI

- [ ] Update Apps List and install the module.
- [ ] Confirm **CRM → Dashboard** is visible to a CRM salesperson.
- [ ] Confirm the client action loads without JavaScript, OWL, or XML errors.
- [ ] Confirm refresh reloads the dashboard.

### Data

Create 10 opportunities in CRM with these stages:

| Stage | Count |
| --- | ---: |
| New | 3 |
| Qualified | 3 |
| Won | 2 |
| Lost | 2 |

- [ ] Confirm opportunity totals, pipeline groups, expected revenue, salesperson rows, source rows, and aging buckets match CRM.
- [ ] Confirm the conversion rate equals won opportunities divided by all opportunities.
- [ ] Create activities on CRM opportunities and verify total, pending, and overdue counts.
- [ ] Mark an activity done and verify the `done` state is counted as completed.

### Security

- [ ] Test as an Administrator.
- [ ] Test as a CRM salesperson with restricted teams/records.
- [ ] Confirm dashboard counts follow the user's CRM record rules and no write/create/delete operation is available.

### Upgrade

```bash
odoo -u crm_dashboard_extension -d Tahcom --stop-after-init
```

- [ ] Confirm the upgrade completes without Python, XML, asset, or registry errors.
- [ ] Restart the Odoo container and retest **CRM → Dashboard**.
