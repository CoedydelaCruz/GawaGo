from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("household", "Household"), ("worker", "Worker")], default="worker", max_length=20)),
                ("skills", models.JSONField(blank=True, default=list)),
                ("hourly_rate", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("daily_rate", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("verification_status", models.CharField(default="pending", max_length=20)),
                ("location_label", models.CharField(blank=True, default="", max_length=255)),
                ("latitude", models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ("longitude", models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ("average_rating", models.DecimalField(blank=True, decimal_places=2, max_digits=3, null=True)),
                ("rating_count", models.PositiveIntegerField(default=0)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="profile", to="auth.user")),
            ],
        ),
    ]
