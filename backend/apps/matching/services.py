from dataclasses import dataclass
from math import asin, cos, radians, sin, sqrt

from apps.accounts.models import UserProfile
from apps.jobs.models import JobPosting


@dataclass
class MatchResult:
    worker_id: int
    worker_username: str
    skills: list[str]
    verification_status: str
    distance_km: float | None
    distance_label: str
    match_score: float
    rating_label: str


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_km = 6371.0
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    a = sin(delta_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(delta_lon / 2) ** 2
    return 2 * earth_radius_km * asin(sqrt(a))


def calculate_match_score(job: JobPosting, profile: UserProfile) -> float:
    score = 0.0
    job_skill = job.required_skill.strip().lower()
    profile_skills = {skill.strip().lower() for skill in profile.skills}

    if job_skill in profile_skills:
        score += 50
    if profile.verification_status == "verified":
        score += 20
    if profile.average_rating is not None:
        score += float(profile.average_rating) * 5
    if profile.hourly_rate is not None and profile.hourly_rate <= job.service_rate:
        score += 10
    return score


def build_match_results(job: JobPosting, workers: list[UserProfile]) -> list[MatchResult]:
    results: list[MatchResult] = []
    for profile in workers:
        distance_km = None
        if profile.has_location:
            distance_km = haversine_distance_km(
                float(job.latitude),
                float(job.longitude),
                float(profile.latitude),
                float(profile.longitude),
            )
        distance_label = "Location unavailable" if distance_km is None else f"{distance_km:.2f} km away"
        results.append(
            MatchResult(
                worker_id=profile.user_id,
                worker_username=profile.user.username,
                skills=list(profile.skills),
                verification_status=profile.verification_status,
                distance_km=distance_km,
                distance_label=distance_label,
                match_score=calculate_match_score(job, profile),
                rating_label=profile.display_rating,
            )
        )
    results.sort(
        key=lambda result: (
            -(result.match_score),
            result.distance_km is None,
            result.distance_km if result.distance_km is not None else float("inf"),
            result.worker_username,
        )
    )
    return results
