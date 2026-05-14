from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import UserProfile
from apps.common.models import VerificationRequest
from apps.jobs.models import JobApplication, JobPosting
from apps.reviews.models import Review


HOUSEHOLDS = [
    {"username": "Household 1", "password": "Household 1", "first_name": "Household", "last_name": "One", "email": "household1@gmail.com", "phone": "9170000001", "barangay": "Poblacion", "street": "Demo Street 1", "lat": "13.9411000", "lng": "121.5874000"},
    {"username": "Household 2", "password": "Household 2", "first_name": "Household", "last_name": "Two", "email": "household2@gmail.com", "phone": "9170000002", "barangay": "Isabang", "street": "Demo Street 2", "lat": "13.9633000", "lng": "121.5447000"},
    {"username": "Household 3", "password": "Household 3", "first_name": "Household", "last_name": "Three", "email": "household3@gmail.com", "phone": "9170000003", "barangay": "San Roque", "street": "Demo Street 3", "lat": "13.9431000", "lng": "121.5827000"},
    {"username": "Household 4", "password": "Household 4", "first_name": "Household", "last_name": "Four", "email": "household4@gmail.com", "phone": "9170000004", "barangay": "Calumpang", "street": "Demo Street 4", "lat": "13.9404000", "lng": "121.5528000"},
    {"username": "Household 5", "password": "Household 5", "first_name": "Household", "last_name": "Five", "email": "household5@gmail.com", "phone": "9170000005", "barangay": "Dapdap", "street": "Demo Street 5", "lat": "13.9616000", "lng": "121.6168000"},
]

WORKERS = [
    {"username": "Worker1", "password": "Worker123", "first_name": "Worker", "last_name": "One", "email": "worker1@gmail.com", "phone": "9180000001", "barangay": "Poblacion", "street": "Worker Street 1", "lat": "13.9411000", "lng": "121.5874000", "skills": ["House Cleaning", "Laundry"], "hourly": "120.00", "daily": "650.00", "years": 3, "verification": "verified", "rating": "4.90", "rating_count": 3},
    {"username": "Worker2", "password": "Worker123", "first_name": "Worker", "last_name": "Two", "email": "worker2@gmail.com", "phone": "9180000002", "barangay": "Isabang", "street": "Worker Street 2", "lat": "13.9633000", "lng": "121.5447000", "skills": ["Plumbing", "Carpentry"], "hourly": "180.00", "daily": "900.00", "years": 5, "verification": "verified", "rating": "4.50", "rating_count": 2},
    {"username": "Worker3", "password": "Worker123", "first_name": "Worker", "last_name": "Three", "email": "worker3@gmail.com", "phone": "9180000003", "barangay": "San Roque", "street": "Worker Street 3", "lat": "13.9431000", "lng": "121.5827000", "skills": ["Electrical Work", "Aircon Repair/Cleaning"], "hourly": "200.00", "daily": "1000.00", "years": 4, "verification": "pending", "rating": "4.00", "rating_count": 1},
    {"username": "Worker4", "password": "Worker123", "first_name": "Worker", "last_name": "Four", "email": "worker4@gmail.com", "phone": "9180000004", "barangay": "Calumpang", "street": "Worker Street 4", "lat": "13.9404000", "lng": "121.5528000", "skills": ["Childcare", "Cooking"], "hourly": "130.00", "daily": "700.00", "years": 2, "verification": "rejected", "rating": "3.00", "rating_count": 1},
    {"username": "Worker5", "password": "Worker123", "first_name": "Worker", "last_name": "Five", "email": "worker5@gmail.com", "phone": "9180000005", "barangay": "Dapdap", "street": "Worker Street 5", "lat": "13.9616000", "lng": "121.6168000", "skills": ["Laundry", "House Cleaning", "Cooking"], "hourly": "110.00", "daily": "600.00", "years": 1, "verification": "pending", "rating": None, "rating_count": 0},
]

JOBS = [
    {"household": "Household 1", "worker": "Worker1", "title": "House Cleaning Help", "skill": "House Cleaning", "status": JobPosting.STATUS_OPEN, "application_status": JobApplication.STATUS_PENDING, "barangay": "Poblacion", "lat": "13.9411000", "lng": "121.5874000", "rate": "700.00", "months_ago": 0},
    {"household": "Household 2", "worker": "Worker2", "title": "Kitchen Plumbing Repair", "skill": "Plumbing", "status": JobPosting.STATUS_COMPLETED, "application_status": JobApplication.STATUS_CLOSED, "barangay": "Isabang", "lat": "13.9633000", "lng": "121.5447000", "rate": "950.00", "months_ago": 1},
    {"household": "Household 3", "worker": "Worker3", "title": "Electrical Outlet Check", "skill": "Electrical Work", "status": JobPosting.STATUS_COMPLETED, "application_status": JobApplication.STATUS_CLOSED, "barangay": "San Roque", "lat": "13.9431000", "lng": "121.5827000", "rate": "1200.00", "months_ago": 2},
    {"household": "Household 4", "worker": "Worker5", "title": "Laundry Assistance", "skill": "Laundry", "status": JobPosting.STATUS_CANCELLED, "application_status": None, "barangay": "Calumpang", "lat": "13.9404000", "lng": "121.5528000", "rate": "500.00", "months_ago": 3},
    {"household": "Household 5", "worker": "Worker4", "title": "Childcare Support", "skill": "Childcare", "status": JobPosting.STATUS_OPEN, "application_status": JobApplication.STATUS_PENDING, "barangay": "Dapdap", "lat": "13.9616000", "lng": "121.6168000", "rate": "750.00", "months_ago": 4},
    {"household": "Household 1", "worker": "Worker5", "title": "Cooking Support", "skill": "Cooking", "status": JobPosting.STATUS_COMPLETED, "application_status": JobApplication.STATUS_CLOSED, "barangay": "Poblacion", "lat": "13.9411000", "lng": "121.5874000", "rate": "650.00", "months_ago": 5},
]

REVIEWS = [
    {"author": "Household 1", "target": "Worker1", "job_title": "House Cleaning Help", "rating": 5, "feedback": "Reliable and fast."},
    {"author": "Household 2", "target": "Worker2", "job_title": "Kitchen Plumbing Repair", "rating": 5, "feedback": "Very professional."},
    {"author": "Household 3", "target": "Worker3", "job_title": "Electrical Outlet Check", "rating": 4, "feedback": "Solved the issue."},
    {"author": "Household 5", "target": "Worker4", "job_title": "Childcare Support", "rating": 3, "feedback": "Completed basic tasks."},
    {"author": "Household 1", "target": "Worker5", "job_title": "Cooking Support", "rating": 4, "feedback": "Helpful and punctual."},
]


class Command(BaseCommand):
    help = "Seed GawaGo backend demo users, jobs, reviews, and verification records."

    @transaction.atomic
    def handle(self, *args, **options):
        users = {}
        created_users = 0

        for account in HOUSEHOLDS:
            user, created = self._upsert_user(account, is_staff=False)
            created_users += int(created)
            users[account["username"]] = user
            self._upsert_profile(user, account, UserProfile.ROLE_HOUSEHOLD)

        for account in WORKERS:
            user, created = self._upsert_user(account, is_staff=False)
            created_users += int(created)
            users[account["username"]] = user
            self._upsert_profile(user, account, UserProfile.ROLE_WORKER)

        jobs_created = 0
        for job_data in JOBS:
            job, created = self._upsert_job(users, job_data)
            jobs_created += int(created)
            if job_data["application_status"]:
                JobApplication.objects.update_or_create(
                    job=job,
                    worker=users[job_data["worker"]],
                    defaults={"status": job_data["application_status"], "note": "Demo application"},
                )

        for review_data in REVIEWS:
            self._upsert_review(users, review_data)

        self._upsert_verification(users["Worker3"], VerificationRequest.STATUS_PENDING, "Awaiting admin review.", "")
        self._upsert_verification(users["Worker4"], VerificationRequest.STATUS_REJECTED, "Document image needs resubmission.", "Please upload clearer documents.")

        self.stdout.write(self.style.SUCCESS(f"Seeded backend demo data. New users: {created_users}, new jobs: {jobs_created}."))

    def _upsert_user(self, account, is_staff=False):
        user, created = User.objects.get_or_create(
            username=account["username"],
            defaults={
                "email": account["email"],
                "first_name": account["first_name"],
                "last_name": account["last_name"],
                "is_active": True,
                "is_staff": is_staff,
            },
        )
        user.email = account["email"]
        user.first_name = account["first_name"]
        user.last_name = account["last_name"]
        user.is_active = True
        user.is_staff = is_staff
        user.set_password(account["password"])
        user.save()
        return user, created

    def _upsert_profile(self, user, account, role):
        profile, _ = UserProfile.objects.get_or_create(user=user, defaults={"role": role})
        profile.role = role
        profile.phone = account["phone"]
        profile.location_label = f"{account['barangay']}, {account['street']}"
        profile.latitude = Decimal(account["lat"])
        profile.longitude = Decimal(account["lng"])
        if role == UserProfile.ROLE_WORKER:
            profile.bio = f"Demo profile for {user.get_full_name() or user.username}."
            profile.skills = account["skills"]
            profile.hourly_rate = Decimal(account["hourly"])
            profile.daily_rate = Decimal(account["daily"])
            profile.years_experience = account["years"]
            profile.verification_status = account["verification"]
            profile.average_rating = Decimal(account["rating"]) if account["rating"] else None
            profile.rating_count = account["rating_count"]
        profile.save()
        return profile

    def _upsert_job(self, users, job_data):
        household = users[job_data["household"]]
        job, created = JobPosting.objects.update_or_create(
            household=household,
            title=job_data["title"],
            defaults={
                "job_type": job_data["skill"],
                "required_skill": job_data["skill"],
                "schedule": "Demo schedule",
                "description": f"Demo {job_data['skill']} request for analytics.",
                "location_label": job_data["barangay"],
                "latitude": Decimal(job_data["lat"]),
                "longitude": Decimal(job_data["lng"]),
                "service_rate": Decimal(job_data["rate"]),
                "worker_slots": 1,
                "status": job_data["status"],
            },
        )
        created_at = timezone.now() - timezone.timedelta(days=30 * job_data["months_ago"])
        JobPosting.objects.filter(pk=job.pk).update(created_at=created_at)
        job.refresh_from_db()
        return job, created

    def _upsert_review(self, users, review_data):
        author = users[review_data["author"]]
        target = users[review_data["target"]]
        review = Review.objects.filter(author=author, target=target, job_title=review_data["job_title"]).first()
        if review is None:
            review = Review(author=author, target=target, job_title=review_data["job_title"])
        review.author_role = UserProfile.ROLE_HOUSEHOLD
        review.target_role = UserProfile.ROLE_WORKER
        review.rating = review_data["rating"]
        review.feedback = review_data["feedback"]
        review.save()
        return review

    def _upsert_verification(self, worker, status, notes, review_note):
        request = VerificationRequest.objects.filter(worker=worker).order_by("-submitted_at").first()
        if request is None:
            request = VerificationRequest(worker=worker)
        request.primary_id_name = "Demo Primary ID"
        request.secondary_doc_name = "Demo Supporting Document"
        request.notes = notes
        request.status = status
        request.review_note = review_note
        request.reviewed_at = timezone.now() if status != VerificationRequest.STATUS_PENDING else None
        request.save()
        return request
