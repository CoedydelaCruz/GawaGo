from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="JobPosting",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("job_type", models.CharField(max_length=120)),
                ("required_skill", models.CharField(max_length=120)),
                ("schedule", models.CharField(max_length=255)),
                ("location_label", models.CharField(max_length=255)),
                ("latitude", models.DecimalField(decimal_places=7, max_digits=10)),
                ("longitude", models.DecimalField(decimal_places=7, max_digits=10)),
                ("service_rate", models.DecimalField(decimal_places=2, max_digits=10)),
                ("status", models.CharField(choices=[("open", "Open"), ("assigned", "Assigned"), ("completed", "Completed"), ("cancelled", "Cancelled")], default="open", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("household", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="job_postings", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
