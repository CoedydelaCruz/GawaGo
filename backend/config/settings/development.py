from .base import *  # noqa

DEBUG = True
ALLOWED_HOSTS = ["*"]

# Use SQLite locally when MySQL is not available.
if os.environ.get("DJANGO_USE_SQLITE_FOR_DEV", "False") == "True":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "dev-db.sqlite3",
        }
    }

if os.environ.get("DJANGO_USE_CONSOLE_EMAIL", "False") == "True":
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
