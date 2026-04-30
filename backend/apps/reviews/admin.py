from django.contrib import admin

from apps.reviews.models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("author", "target", "author_role", "target_role", "rating", "created_at")
    list_filter = ("author_role", "target_role", "created_at")
    search_fields = ("author__username", "target__username", "job_title", "feedback")
