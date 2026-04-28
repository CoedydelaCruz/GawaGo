import React, { useEffect, useState } from "react";
import seedData from "./data/appData.json";

const SKILLS = [
  "House Cleaning",
  "Cooking",
  "Laundry",
  "Childcare",
  "Elder Care",
  "Gardening",
  "Electrical Work",
  "Plumbing",
  "Carpentry",
  "Painting",
  "Aircon Repair/Cleaning",
  "Welding",
  "Driving",
  "Other",
];

const BARANGAYS = [
  "Alitao",
  "Anos",
  "Ayaas",
  "Baguio",
  "Bakal",
  "Bucal",
  "Bulkan",
  "Calumpang",
  "Camaysa",
  "Dapdap",
  "Del Rosario",
  "Gibanga",
  "Ilasan",
  "Isabang",
  "Lalo",
  "Lita",
  "Mateuna",
  "Mayowe",
  "Opias",
  "Palale",
  "Piis",
  "Rizaliana",
  "San Diego",
  "San Isidro",
  "San Roque",
  "Talolong",
  "Tongko",
  "Wakas",
  "Poblacion",
];

const STORAGE_KEYS = {
  workers: "gawago-registered-workers",
  households: "gawago-registered-households",
  jobs: "gawago-posted-jobs",
  verificationRequests: "gawago-verification-requests",
  notificationReads: "gawago-notification-reads",
};

const ADMIN_ACCOUNT = {
  username: "admin",
  password: "admin123",
  displayName: "System Admin",
};

const DEMO_DATA_VERSION = "v8";
const DEMO_VERSION_KEY = "gawago-demo-data-version";

function clearDemoStorage() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.clear();
  window.localStorage.removeItem(STORAGE_KEYS.workers);
  window.localStorage.removeItem(STORAGE_KEYS.households);
  window.localStorage.removeItem(STORAGE_KEYS.jobs);
  window.localStorage.removeItem(STORAGE_KEYS.verificationRequests);
  window.localStorage.removeItem(STORAGE_KEYS.notificationReads);
  window.localStorage.setItem(DEMO_VERSION_KEY, DEMO_DATA_VERSION);
}

function ensureDemoVersion() {
  if (typeof window === "undefined") {
    return;
  }

  const savedVersion = window.localStorage.getItem(DEMO_VERSION_KEY);
  if (savedVersion !== DEMO_DATA_VERSION) {
    clearDemoStorage();
  }
}

const STATUS_PRIORITY = {
  Pending: 1,
  "Under Review": 2,
  Approved: 3,
  Rejected: 4,
};

function getStoredCollection(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const storedValue = window.localStorage.getItem(key);
  if (!storedValue) {
    return fallback;
  }

  try {
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : fallback;
  } catch (error) {
    return fallback;
  }
}

function getStoredObject(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const storedValue = window.localStorage.getItem(key);
  if (!storedValue) {
    return fallback;
  }

  try {
    const parsedValue = JSON.parse(storedValue);
    return parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue) ? parsedValue : fallback;
  } catch (error) {
    return fallback;
  }
}

function getNotificationReadState() {
  return getStoredObject(STORAGE_KEYS.notificationReads, {});
}

function getDisplayName(firstName, lastName, username) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  return fullName || username || "User";
}

function formatCurrency(amount) {
  const value = Number(amount || 0);
  return `PHP ${value.toFixed(2)}`;
}

function formatRate(amount, rateType) {
  return `${formatCurrency(amount)} / ${rateType || "Per Day"}`;
}

function formatScheduleLabel(scheduleType) {
  return (scheduleType || "").replace(" - ", "-");
}

function formatDateTime(dateValue, timeValue) {
  if (!dateValue) {
    return "Schedule not set";
  }

  const parsedDate = new Date(`${dateValue}T${timeValue || "00:00"}`);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Schedule not set";
  }

  return parsedDate.toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLocation(barangay, streetAddress) {
  return [barangay, streetAddress].filter(Boolean).join(", ") || "Location not set";
}

function renderBarangayOptions() {
  return BARANGAYS.map((barangay) => (
    <option key={barangay} value={barangay}>
      {barangay}
    </option>
  ));
}

function buildMatchedWorkersForJob(job, workers) {
  const matchedWorkers = (job.matchedWorkerIds || [])
    .map((workerId) => workers.find((worker) => worker.id === workerId))
    .filter(Boolean);

  const dynamicMatches = workers.filter((worker) => {
    if (matchedWorkers.some((item) => item.id === worker.id)) {
      return false;
    }
    return (worker.skills || []).includes(job.serviceType);
  });

  return [...matchedWorkers, ...dynamicMatches];
}

function getWorkerJobMatches(worker, jobs) {
  if (!worker) {
    return [];
  }

  const workerSkills = worker.skills || [];

  return jobs
    .filter((job) => job.status !== "Cancelled")
    .map((job) => {
      const matchesSkill = workerSkills.includes(job.serviceType);
      return {
        ...job,
        matchesSkill,
      };
    })
    .sort((firstJob, secondJob) => {
      if (firstJob.matchesSkill === secondJob.matchesSkill) {
        return new Date(secondJob.createdAt).getTime() - new Date(firstJob.createdAt).getTime();
      }
      return firstJob.matchesSkill ? -1 : 1;
    });
}

function createJobRecord(jobForm, currentHousehold, jobId) {
  return {
    id: jobId,
    householdUsername: currentHousehold?.username || "",
    householdName: getDisplayName(
      currentHousehold?.firstName,
      currentHousehold?.lastName,
      currentHousehold?.username
    ),
    jobTitle: jobForm.jobTitle.trim() || jobForm.serviceType,
    serviceType: jobForm.serviceType,
    scheduleType: jobForm.scheduleType,
    preferredDate: jobForm.preferredDate,
    preferredTime: jobForm.preferredTime,
    description: jobForm.description.trim(),
    barangay: jobForm.barangay.trim(),
    streetAddress: jobForm.streetAddress.trim(),
    offeredRate: String(jobForm.offeredRate),
    rateType: jobForm.rateType,
    status: "Open",
    matchedWorkerIds: [],
    applications: [],
    createdAt: new Date().toISOString(),
  };
}

function getHouseholdNotifications(jobs, workers) {
  return jobs
    .flatMap((job) =>
      (job.applications || []).map((application) => {
        const worker = workers.find((item) => item.id === application.workerId);
        return {
          id: `application-${job.id}-${application.workerId}-${application.appliedAt}`,
          title: "New worker application",
          message: `${getDisplayName(worker?.firstName, worker?.lastName, worker?.username)} applied to "${job.jobTitle || job.serviceType}".`,
          date: application.appliedAt || "Recently",
          workerId: application.workerId,
          jobId: job.id,
        };
      })
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function getVerificationNotifications(requests, workers) {
  return requests
    .map((request) => {
      const worker = workers.find((item) => item.id === request.workerId);
      return {
        id: `verification-${request.id}`,
        title: `Verification ${request.status}`,
        message: `${getDisplayName(worker?.firstName, worker?.lastName, worker?.username)}'s documents are ${request.status.toLowerCase()}.`,
        date: request.submittedAt || request.reviewedAt || "Recently",
      };
    })
    .sort((a, b) => (STATUS_PRIORITY[a.title.split(" ").pop()] || 0) - (STATUS_PRIORITY[b.title.split(" ").pop()] || 0));
}

export default function App() {
  ensureDemoVersion();
  const [dashboardMetrics, setDashboardMetrics] = useState({
    openJobs: 0,
    verifiedWorkers: 0,
    completedJobs: 0,
    totalAccounts: 0,
    avgRating: null,
  });
  const [view, setView] = useState("home");
  const [loginForm, setLoginForm] = useState({ username: "", password: "", role: "worker" });
  const [currentUser, setCurrentUser] = useState(null);
  const [registeredWorkers, setRegisteredWorkers] = useState(() => getStoredCollection(STORAGE_KEYS.workers, []));
  const [registeredHouseholds, setRegisteredHouseholds] = useState(() => getStoredCollection(STORAGE_KEYS.households, []));
  const [verificationRequests, setVerificationRequests] = useState(() =>
    getStoredCollection(STORAGE_KEYS.verificationRequests, [])
  );
  const [postedJobs, setPostedJobs] = useState(() => getStoredCollection(STORAGE_KEYS.jobs, []));
  const [selectedVerificationRequestId, setSelectedVerificationRequestId] = useState(() =>
    getStoredCollection(STORAGE_KEYS.verificationRequests, [])[0]?.id || null
  );
  const [adminSection, setAdminSection] = useState("verification");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [notificationReads, setNotificationReads] = useState(() => getNotificationReadState());
  const [workerForm, setWorkerForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    barangay: "",
    streetAddress: "",
    bio: "",
    hourlyRate: "0.00",
    dailyRate: "0.00",
    yearsExperience: "0",
    password: "",
    confirmPassword: "",
    skills: [],
  });
  const [householdForm, setHouseholdForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    barangay: "",
    streetAddress: "",
    password: "",
    confirmPassword: "",
  });
  const [householdProfileForm, setHouseholdProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    barangay: "",
    streetAddress: "",
    profilePhotoName: "",
    profilePhotoPreview: "",
  });
  const [householdJobForm, setHouseholdJobForm] = useState({
    jobTitle: "",
    serviceType: "",
    scheduleType: "One - Time",
    preferredDate: "",
    preferredTime: "",
    description: "",
    barangay: "",
    streetAddress: "",
    offeredRate: "0.00",
    rateType: "Per Day",
  });
  const [workerProfileForm, setWorkerProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    barangay: "",
    streetAddress: "",
    bio: "",
    hourlyRate: "0.00",
    dailyRate: "0.00",
    yearsExperience: "0",
    skills: [],
    availability: true,
    profilePhotoPreview: "",
  });
  const [verificationForm, setVerificationForm] = useState({
    primaryIdName: "",
    secondaryDocName: "",
    notes: "",
    primaryIdPreview: "",
    secondaryDocPreview: "",
  });
  const [adminLoginForm, setAdminLoginForm] = useState({ username: "", password: "" });

  const currentWorker = registeredWorkers.find((item) => item.username === currentUser?.username);
  const currentHousehold = registeredHouseholds.find((item) => item.username === currentUser?.username);
  const householdJobs = postedJobs.filter(
    (item) => item.householdUsername === currentUser?.username && item.status !== "Cancelled"
  );
  const selectedJob =
    householdJobs.find((item) => item.id === selectedJobId) || householdJobs[0] || postedJobs[0] || null;
  const selectedMatchedWorkers = selectedJob
    ? buildMatchedWorkersForJob(selectedJob, registeredWorkers)
    : [];
  const selectedWorker = registeredWorkers.find((worker) => worker.id === selectedWorkerId) || null;
  const selectedVerificationRequest =
    verificationRequests.find((item) => item.id === selectedVerificationRequestId) || verificationRequests[0] || null;
  const workerVisibleJobs = getWorkerJobMatches(currentWorker, postedJobs);
  const workerMatchedJobs = workerVisibleJobs.filter((job) => job.matchesSkill);
  const workerMiniPhoto = currentWorker?.profilePhotoPreview || currentWorker?.verificationSubmission?.primaryIdPreview || "";
  const householdNotifications = getHouseholdNotifications(householdJobs, registeredWorkers);
  const verificationNotifications = getVerificationNotifications(verificationRequests, registeredWorkers);
  const workerNotifications = [
    ...(currentWorker?.verificationNotifications || []),
    ...(currentWorker?.applicationNotifications || []),
  ];
  const householdNotificationsWithReadState = householdNotifications.map((item) => ({
    ...item,
    unread: !notificationReads[item.id],
  }));
  const workerNotificationsWithReadState = (workerNotifications.length > 0 ? workerNotifications : verificationNotifications).map((item) => ({
    ...item,
    unread: !notificationReads[item.id],
  }));
  const workerApplications = currentWorker
    ? postedJobs.flatMap((job) =>
        (job.applications || [])
          .filter((application) => application.workerId === currentWorker.id)
          .map((application) => ({
            ...job,
            appliedAt: application.appliedAt,
            applicationStatus: application.status,
            applicationId: application.id,
          }))
      )
    : [];
  const currentWorkerJobDetail =
    workerVisibleJobs.find((item) => item.id === selectedJobId) || workerVisibleJobs[0] || null;
  const adminVisibleWorkers = registeredWorkers.filter((worker) => Boolean(worker.verificationSubmission));
  const pendingVerificationRequests = verificationRequests.filter((item) => item.status === "Pending" || item.status === "Under Review");
  const approvedVerificationRequests = verificationRequests.filter((item) => item.status === "Approved");
  const rejectedVerificationRequests = verificationRequests.filter((item) => item.status === "Rejected");
  const householdUnreadCount = householdNotificationsWithReadState.filter((item) => item.unread).length;
  const workerUnreadCount = workerNotificationsWithReadState.filter((item) => item.unread).length;
  const workerApplicationUnreadCount = workerApplications.filter((job) => {
    const notificationId = `worker-application-${job.applicationId}`;
    return job.applicationStatus === "Hired" && !notificationReads[notificationId];
  }).length;

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardMetrics() {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/analytics/dashboard-metrics/");
        if (!response.ok) {
          throw new Error("Failed to load dashboard metrics");
        }

        const data = await response.json();
        if (!cancelled) {
          setDashboardMetrics({
            openJobs: data.open_jobs ?? 0,
            verifiedWorkers: data.verified_workers ?? 0,
            completedJobs: data.completed_jobs ?? 0,
            totalAccounts: data.total_accounts ?? 0,
            avgRating: data.avg_rating,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardMetrics({
            openJobs: postedJobs.filter((job) => job.status === "Open").length,
            verifiedWorkers: registeredWorkers.filter((worker) => worker.verification === "Verified").length,
            completedJobs: postedJobs.filter((job) => job.status === "Completed").length,
            totalAccounts: registeredWorkers.length + registeredHouseholds.length,
            avgRating: null,
          });
        }
      }
    }

    loadDashboardMetrics();

    return () => {
      cancelled = true;
    };
  }, [postedJobs, registeredHouseholds.length, registeredWorkers.length]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.workers, JSON.stringify(registeredWorkers));
  }, [registeredWorkers]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.households, JSON.stringify(registeredHouseholds));
  }, [registeredHouseholds]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(postedJobs));
  }, [postedJobs]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.verificationRequests, JSON.stringify(verificationRequests));
  }, [verificationRequests]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.notificationReads, JSON.stringify(notificationReads));
  }, [notificationReads]);

  useEffect(() => {
    if (verificationRequests.length === 0) {
      setSelectedVerificationRequestId(null);
      return;
    }

    if (!verificationRequests.some((item) => item.id === selectedVerificationRequestId)) {
      setSelectedVerificationRequestId(verificationRequests[0].id);
    }
  }, [verificationRequests, selectedVerificationRequestId]);

  useEffect(() => {
    if (!householdJobs.length) {
      setSelectedJobId(null);
      return;
    }

    if (!householdJobs.some((item) => item.id === selectedJobId)) {
      setSelectedJobId(householdJobs[0].id);
    }
  }, [householdJobs, selectedJobId]);

  function goHome() {
    setView("home");
  }

  function goBack() {
    if (currentUser?.role === "admin") {
      setView("admin-dashboard");
      return;
    }
    if (currentUser?.role === "household") {
      setView("household-dashboard");
      return;
    }
    if (currentUser?.role === "worker") {
      setView("worker-dashboard");
      return;
    }
    setView("home");
  }

  function handleLogout() {
    setCurrentUser(null);
    setSelectedWorkerId(null);
    setSelectedJobId(null);
    setLoginForm({ username: "", password: "", role: "worker" });
    setView("home");
  }

  function openLogin() {
    setView("login");
  }

  function openWorkerRegister() {
    setView("register-worker");
  }

  function openHouseholdRegister() {
    setView("register-household");
  }

  function openWorkerDashboard() {
    setView("worker-dashboard");
  }

  function openWorkerFindJobs() {
    setView("worker-find-jobs");
  }

  function openWorkerApplications() {
    markAllWorkerApplicationsRead();
    markAllWorkerNotificationsRead();
    setView("worker-applications");
  }

  function openWorkerProfile() {
    if (currentWorker) {
      setWorkerProfileForm({
        firstName: currentWorker.firstName || "",
        lastName: currentWorker.lastName || "",
        username: currentWorker.username || "",
        email: currentWorker.email || "",
        phone: currentWorker.phone || "",
        barangay: currentWorker.barangay || "",
        streetAddress: currentWorker.streetAddress || "",
        bio: currentWorker.bio || "",
        hourlyRate: currentWorker.hourlyRate || "0.00",
        dailyRate: currentWorker.dailyRate || "0.00",
        yearsExperience: currentWorker.yearsExperience || "0",
        skills: currentWorker.skills || [],
        availability: true,
        profilePhotoPreview:
          currentWorker.profilePhotoPreview || currentWorker.verificationSubmission?.primaryIdPreview || "",
      });
    }
    setView("worker-profile");
  }

  function openWorkerGetVerified() {
    setView("worker-get-verified");
  }

  function openWorkerNotifications() {
    markAllNotificationsRead(workerNotificationsWithReadState);
    setView("worker-notifications");
  }

  function openAdminDashboard() {
    setAdminSection("verification");
    setView("admin-dashboard");
  }

  function openAdminWorkersHistory() {
    setAdminSection("history");
    setView("admin-dashboard");
  }

  function openHouseholdDashboard() {
    setView("household-dashboard");
  }

  function openHouseholdPostJob() {
    if (currentHousehold) {
      setHouseholdJobForm((prev) => ({
        ...prev,
        barangay: prev.barangay || currentHousehold.barangay || "",
        streetAddress: prev.streetAddress || currentHousehold.streetAddress || "",
      }));
    }
    setView("household-post-job");
  }

  function openHouseholdProfile() {
    if (currentHousehold) {
      setHouseholdProfileForm({
        firstName: currentHousehold.firstName || "",
        lastName: currentHousehold.lastName || "",
        username: currentHousehold.username || "",
        email: currentHousehold.email || "",
        phone: currentHousehold.phone || "",
        barangay: currentHousehold.barangay || "",
        streetAddress: currentHousehold.streetAddress || "",
        profilePhotoName: currentHousehold.profilePhotoName || "",
        profilePhotoPreview: currentHousehold.profilePhotoPreview || "",
      });
    }
    setView("household-profile");
  }

  function openHouseholdMyJobs() {
    setView("household-my-jobs");
  }

  function openHouseholdNotifications() {
    markAllNotificationsRead(householdNotificationsWithReadState);
    setView("household-notifications");
  }

  function openHouseholdJobDetail(jobId) {
    setSelectedJobId(jobId);
    setSelectedWorkerId(null);
    setView("household-my-jobs");
  }

  function openWorkerJobDetail(jobId) {
    setSelectedJobId(jobId);
    setSelectedWorkerId(null);
    setView("worker-job-detail");
  }

  function openVerificationRequest(requestId) {
    setSelectedVerificationRequestId(requestId);
  }

  function markNotificationRead(notificationId) {
    if (!notificationId) return;
    setNotificationReads((prev) => (prev[notificationId] ? prev : { ...prev, [notificationId]: true }));
  }

  function markAllNotificationsRead(notifications) {
    setNotificationReads((prev) => {
      const nextState = { ...prev };
      let changed = false;
      notifications.forEach((notification) => {
        if (!nextState[notification.id]) {
          nextState[notification.id] = true;
          changed = true;
        }
      });
      return changed ? nextState : prev;
    });
  }

  function markAllWorkerNotificationsRead() {
    markAllNotificationsRead(workerNotificationsWithReadState);
  }

  function markAllWorkerApplicationsRead() {
    if (!workerApplications.length) {
      return;
    }

    setNotificationReads((prev) => {
      const nextState = { ...prev };
      let changed = false;
      workerApplications.forEach((job) => {
        if (job.applicationStatus !== "Hired") {
          return;
        }

        const notificationId = `worker-application-${job.applicationId}`;
        if (!nextState[notificationId]) {
          nextState[notificationId] = true;
          changed = true;
        }
      });
      return changed ? nextState : prev;
    });
  }

  function openFilePreview(fileUrl) {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }

  function handleApplyToJob(jobId) {
    if (!currentWorker) {
      window.alert("Please login as a worker first.");
      return;
    }

    const job = postedJobs.find((item) => item.id === jobId);
    if (!job) {
      window.alert("Job not found.");
      return;
    }

    const alreadyApplied = (job.applications || []).some((application) => application.workerId === currentWorker.id);
    if (alreadyApplied) {
      window.alert("You already applied for this job.");
      return;
    }

    const appliedAt = new Date().toLocaleString("en-PH");
    const application = {
      id: `application-${job.id}-${currentWorker.id}-${Date.now()}`,
      workerId: currentWorker.id,
      workerName: getDisplayName(currentWorker.firstName, currentWorker.lastName, currentWorker.username),
      workerUsername: currentWorker.username,
      appliedAt,
      status: "Pending",
    };

    setPostedJobs((prev) =>
      prev.map((item) =>
        item.id === jobId
          ? {
              ...item,
              applications: [...(item.applications || []), application],
            }
          : item
      )
    );

    window.alert("Application sent to the household.");
    setView("worker-applications");
  }

  function openHouseholdNotificationWorker(notification) {
    if (!notification?.workerId) return;
    markNotificationRead(notification.id);
    openMatchedWorkerProfile(notification.workerId, notification.jobId);
  }

  function openMatchedWorkerProfile(workerId, jobId = selectedJob?.id) {
    setSelectedWorkerId(workerId);
    if (jobId) {
      setSelectedJobId(jobId);
    }
    setView("household-worker-profile");
  }

  function handleHireWorker() {
    if (!currentHousehold) {
      window.alert("Please login as a household first.");
      return;
    }

    if (!selectedWorker) {
      window.alert("Worker profile not found.");
      return;
    }

    if (!selectedJob) {
      window.alert("Please select a job first.");
      return;
    }

    const existingApplication = (selectedJob.applications || []).find(
      (application) => application.workerId === selectedWorker.id
    );

    const hiredAt = new Date().toLocaleString("en-PH");
    const applicationRecord = existingApplication
      ? {
          ...existingApplication,
          status: "Hired",
          hiredAt,
        }
      : {
          id: `application-${selectedJob.id}-${selectedWorker.id}-${Date.now()}`,
          workerId: selectedWorker.id,
          workerName: getDisplayName(selectedWorker.firstName, selectedWorker.lastName, selectedWorker.username),
          workerUsername: selectedWorker.username,
          appliedAt: hiredAt,
          hiredAt,
          status: "Hired",
        };

    setPostedJobs((prev) =>
      prev.map((job) =>
        job.id === selectedJob.id
          ? {
              ...job,
              status: "Assigned",
              selectedWorkerId: selectedWorker.id,
              selectedWorkerName: getDisplayName(selectedWorker.firstName, selectedWorker.lastName, selectedWorker.username),
              applications: existingApplication
                ? (job.applications || []).map((application) =>
                    application.workerId === selectedWorker.id ? applicationRecord : application
                  )
                : [...(job.applications || []), applicationRecord],
            }
          : job
      )
    );

    setRegisteredWorkers((prev) =>
      prev.map((worker) =>
        worker.id === selectedWorker.id
          ? {
              ...worker,
              status: "Hired",
              hiredBy: currentHousehold.username,
              hiredJobId: selectedJob.id,
              applicationNotifications: [
                ...(worker.applicationNotifications || []),
                {
                  id: `hired-${selectedJob.id}-${selectedWorker.id}-${Date.now()}`,
                  title: "You were hired",
                  message: `${getDisplayName(currentHousehold.firstName, currentHousehold.lastName, currentHousehold.username)} hired you for ${selectedJob.jobTitle || selectedJob.serviceType}.`,
                  date: hiredAt,
                  unread: true,
                },
              ],
            }
          : worker
      )
    );

    window.alert(`${getDisplayName(selectedWorker.firstName, selectedWorker.lastName, selectedWorker.username)} has been hired for ${selectedJob.jobTitle || selectedJob.serviceType}.`);
    setView("household-my-jobs");
  }

  function handleLoginChange(event) {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleWorkerChange(event) {
    const { name, value } = event.target;
    setWorkerForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleHouseholdChange(event) {
    const { name, value } = event.target;
    setHouseholdForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleHouseholdProfileChange(event) {
    const { name, value, files } = event.target;
    if (name === "profilePhoto") {
      const file = files?.[0];
      setHouseholdProfileForm((prev) => ({
        ...prev,
        profilePhotoName: file?.name || "",
        profilePhotoPreview: file ? URL.createObjectURL(file) : "",
      }));
      return;
    }
    setHouseholdProfileForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleHouseholdJobChange(event) {
    const { name, value } = event.target;
    setHouseholdJobForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleWorkerProfileChange(event) {
    const { name, value, type, checked, files } = event.target;
    if (name === "profilePhoto") {
      const file = files?.[0];
      setWorkerProfileForm((prev) => ({
        ...prev,
        profilePhotoPreview: file ? URL.createObjectURL(file) : "",
      }));
      return;
    }
    setWorkerProfileForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleVerificationChange(event) {
    const { name, value, files } = event.target;
    if (name === "primaryId") {
      const file = files?.[0];
      setVerificationForm((prev) => ({ ...prev, primaryIdName: file?.name || "", primaryIdPreview: file ? URL.createObjectURL(file) : "" }));
      return;
    }
    if (name === "secondaryDoc") {
      const file = files?.[0];
      setVerificationForm((prev) => ({ ...prev, secondaryDocName: file?.name || "", secondaryDocPreview: file ? URL.createObjectURL(file) : "" }));
      return;
    }
    setVerificationForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleSkill(skill) {
    setWorkerForm((prev) => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
      };
    });
  }

  function toggleWorkerProfileSkill(skill) {
    setWorkerProfileForm((prev) => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
      };
    });
  }

  function handleLoginSubmit(event) {
    event.preventDefault();
    const username = loginForm.username.trim();
    const isAdminLogin =
      username.toLowerCase() === ADMIN_ACCOUNT.username && loginForm.password === ADMIN_ACCOUNT.password;

    if (!username || !loginForm.password) {
      window.alert("Please enter your username and password.");
      return;
    }

    if (isAdminLogin) {
      setCurrentUser({
        role: "admin",
        username: ADMIN_ACCOUNT.username,
        displayName: ADMIN_ACCOUNT.displayName,
      });
      setView("admin-dashboard");
      return;
    }

    if (loginForm.role === "worker") {
      const worker = registeredWorkers.find(
        (item) => item.username.toLowerCase() === username.toLowerCase()
      );

      if (!worker) {
        window.alert("Worker account not found. Please register first.");
        return;
      }

      if (worker.password !== loginForm.password) {
        window.alert("Incorrect password.");
        return;
      }

      setCurrentUser({
        role: "worker",
        username: worker.username,
        displayName: getDisplayName(worker.firstName, worker.lastName, worker.username),
      });
      setView("worker-dashboard");
      return;
    }

    const household = registeredHouseholds.find(
      (item) => item.username.toLowerCase() === username.toLowerCase()
    );

    if (!household) {
      window.alert("Household account not found. Please register first.");
      return;
    }

    if (household.password !== loginForm.password) {
      window.alert("Incorrect password.");
      return;
    }

    setCurrentUser({
      role: "household",
      username: household.username,
      displayName: getDisplayName(household.firstName, household.lastName, household.username),
    });
    setView("household-dashboard");
  }

  function handleWorkerRegisterSubmit(event) {
    event.preventDefault();
    if (!workerForm.username.trim() || !workerForm.password) {
      window.alert("Please provide at least username and password.");
      return;
    }

    if (workerForm.password !== workerForm.confirmPassword) {
      window.alert("Worker passwords do not match.");
      return;
    }

    const usernameTaken = registeredWorkers.some(
      (item) => item.username.toLowerCase() === workerForm.username.trim().toLowerCase()
    );
    if (usernameTaken) {
      window.alert("Username already exists for a worker account.");
      return;
    }

    const workerAccount = {
      ...workerForm,
      id: Date.now(),
      username: workerForm.username.trim(),
      verification: "Not Yet Verified",
      rating: "No ratings yet",
      reviewsDone: 0,
      status: "Available",
      distanceKm: "0.00",
      avatar: (workerForm.firstName || workerForm.username || "W").slice(0, 1).toUpperCase(),
      reviews: [],
    };
    setRegisteredWorkers((prev) => [...prev, workerAccount]);
    setLoginForm({
      username: "",
      password: "",
      role: "worker",
    });
    setView("login");
    window.alert("Worker account created. You can now login.");
  }

  function handleHouseholdRegisterSubmit(event) {
    event.preventDefault();
    if (!householdForm.username.trim() || !householdForm.password) {
      window.alert("Please provide at least username and password.");
      return;
    }

    if (householdForm.password !== householdForm.confirmPassword) {
      window.alert("Household passwords do not match.");
      return;
    }

    const usernameTaken = registeredHouseholds.some(
      (item) => item.username.toLowerCase() === householdForm.username.trim().toLowerCase()
    );
    if (usernameTaken) {
      window.alert("Username already exists for a household account.");
      return;
    }

    const householdAccount = {
      ...householdForm,
      id: Date.now(),
      username: householdForm.username.trim(),
    };
    setRegisteredHouseholds((prev) => [...prev, householdAccount]);
    setLoginForm({
      username: "",
      password: "",
      role: "household",
    });
    setView("login");
    window.alert("Household account created. You can now login.");
  }

  function handleWorkerProfileSave(event) {
    event.preventDefault();

    if (!currentUser || currentUser.role !== "worker") {
      window.alert("No worker account is currently logged in.");
      return;
    }

    setRegisteredWorkers((prev) =>
      prev.map((item) => {
        if (item.username !== currentUser.username) {
          return item;
        }
        return {
          ...item,
          firstName: workerProfileForm.firstName,
          lastName: workerProfileForm.lastName,
          email: workerProfileForm.email,
          phone: workerProfileForm.phone,
          barangay: workerProfileForm.barangay,
          streetAddress: workerProfileForm.streetAddress,
          bio: workerProfileForm.bio,
          hourlyRate: workerProfileForm.hourlyRate,
          dailyRate: workerProfileForm.dailyRate,
          yearsExperience: workerProfileForm.yearsExperience,
          skills: workerProfileForm.skills,
          profilePhotoPreview: workerProfileForm.profilePhotoPreview || item.profilePhotoPreview || "",
        };
      })
    );

    setCurrentUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        displayName: getDisplayName(
          workerProfileForm.firstName,
          workerProfileForm.lastName,
          workerProfileForm.username
        ),
      };
    });

    window.alert("Worker profile updated.");
  }

  function handleVerificationSubmit(event) {
    event.preventDefault();
    if (!verificationForm.primaryIdName || !verificationForm.secondaryDocName) {
      window.alert("Please upload both required verification documents.");
      return;
    }

    if (!currentWorker) {
      window.alert("Please login as a worker first.");
      return;
    }

    const requestId = Date.now();
    const existingRequestIndex = verificationRequests.findIndex(
      (item) => item.workerId === currentWorker.id && item.status !== "Rejected"
    );

    const requestRecord = {
      id: existingRequestIndex >= 0 ? verificationRequests[existingRequestIndex].id : requestId,
      workerId: currentWorker.id,
      workerUsername: currentWorker.username,
      workerName: getDisplayName(currentWorker.firstName, currentWorker.lastName, currentWorker.username),
      primaryIdName: verificationForm.primaryIdName,
      secondaryDocName: verificationForm.secondaryDocName,
      primaryIdPreview: verificationForm.primaryIdPreview,
      secondaryDocPreview: verificationForm.secondaryDocPreview,
      notes: verificationForm.notes,
      status: "Pending",
      submittedAt: new Date().toLocaleString("en-PH"),
      reviewedAt: "",
      reviewedBy: "",
      reviewNote: "",
    };

    setVerificationRequests((prev) => {
      if (existingRequestIndex >= 0) {
        return prev.map((item, index) => (index === existingRequestIndex ? requestRecord : item));
      }
      return [requestRecord, ...prev];
    });

    setRegisteredWorkers((prev) =>
      prev.map((worker) =>
        worker.id === currentWorker.id
          ? {
              ...worker,
                verification: "Under Review",
                verificationRequestId: requestRecord.id,
                verificationSubmission: requestRecord,
                verificationNotifications: [
                  {
                    id: `submission-${requestRecord.id}`,
                    title: "Verification Submitted",
                    message: "Your documents were sent to the admin for review.",
                    date: requestRecord.submittedAt,
                    unread: true,
                  },
                ],
              }
          : worker
      )
    );

    window.alert("Verification documents submitted. Please wait for admin review.");
  }

  function handleHouseholdProfileSave(event) {
    event.preventDefault();

    if (!currentUser || currentUser.role !== "household") {
      window.alert("No household account is currently logged in.");
      return;
    }

    setRegisteredHouseholds((prev) =>
      prev.map((item) => {
        if (item.username !== currentUser.username) {
          return item;
        }
        return {
          ...item,
          firstName: householdProfileForm.firstName,
          lastName: householdProfileForm.lastName,
          email: householdProfileForm.email,
          phone: householdProfileForm.phone,
          barangay: householdProfileForm.barangay,
          streetAddress: householdProfileForm.streetAddress,
          profilePhotoName: householdProfileForm.profilePhotoName || item.profilePhotoName || "",
          profilePhotoPreview: householdProfileForm.profilePhotoPreview || item.profilePhotoPreview || "",
        };
      })
    );

    setCurrentUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        displayName: getDisplayName(
          householdProfileForm.firstName,
          householdProfileForm.lastName,
          householdProfileForm.username
        ),
      };
    });

    setPostedJobs((prev) =>
      prev.map((job) => {
        if (job.householdUsername !== currentUser.username) {
          return job;
        }
        return {
          ...job,
          householdName: getDisplayName(
            householdProfileForm.firstName,
            householdProfileForm.lastName,
            householdProfileForm.username
          ),
        };
      })
    );

    window.alert("Household profile updated.");
  }

  function handleCancelJob(jobId) {
    setPostedJobs((prev) => prev.filter((job) => job.id !== jobId));
    if (selectedJobId === jobId) {
      setSelectedJobId(null);
    }
  }

  function handleHouseholdJobSubmit(event) {
    event.preventDefault();
    if (!currentUser || currentUser.role !== "household") {
      window.alert("Please login as a household account first.");
      return;
    }

    if (!householdJobForm.serviceType || !householdJobForm.preferredDate || !householdJobForm.preferredTime) {
      window.alert("Please complete the service type, preferred date, and preferred time.");
      return;
    }

    const newJob = createJobRecord(householdJobForm, currentHousehold, Date.now());
    setPostedJobs((prev) => [newJob, ...prev]);
    setSelectedJobId(newJob.id);
    window.alert("Job posted successfully.");
    setHouseholdJobForm({
      jobTitle: "",
      serviceType: "",
      scheduleType: "One - Time",
      preferredDate: "",
      preferredTime: "",
      description: "",
      barangay: currentHousehold?.barangay || "",
      streetAddress: currentHousehold?.streetAddress || "",
      offeredRate: "0.00",
      rateType: "Per Day",
    });
    setView("household-my-jobs");
  }

  function handleAdminApproveVerification(requestId) {
    const request = verificationRequests.find((item) => item.id === requestId);
    if (!request) return;

    const reviewedAt = new Date().toLocaleString("en-PH");

    setVerificationRequests((prev) =>
      prev.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: "Approved",
              reviewedAt,
              reviewedBy: currentUser?.displayName || "Admin",
              reviewNote: "Approved by admin review.",
            }
          : item
      )
    );

    setRegisteredWorkers((prev) =>
      prev.map((worker) =>
        worker.id === request.workerId
          ? {
              ...worker,
              verification: "Verified",
              verificationReviewedAt: reviewedAt,
              verificationReviewedBy: currentUser?.displayName || "Admin",
              profilePhotoPreview: request.primaryIdPreview || worker.profilePhotoPreview || "",
              verificationNotifications: [
                {
                  id: `approved-${request.id}`,
                  title: "Verified",
                  message: "Your worker account has been verified by the admin.",
                  date: reviewedAt,
                  unread: true,
                },
              ],
            }
          : worker
      )
    );

    window.alert(`Verified ${request.workerName}.`);
    setSelectedVerificationRequestId(requestId);
    setView("admin-dashboard");
  }

  function handleAdminRejectVerification(requestId) {
    const request = verificationRequests.find((item) => item.id === requestId);
    if (!request) return;

    const reviewNote = window.prompt("Enter rejection note:", "Please resubmit clearer documents.") || "Rejected by admin.";
    const reviewedAt = new Date().toLocaleString("en-PH");

    setVerificationRequests((prev) =>
      prev.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: "Rejected",
              reviewedAt,
              reviewedBy: currentUser?.displayName || "Admin",
              reviewNote,
            }
          : item
      )
    );

    setRegisteredWorkers((prev) =>
      prev.map((worker) =>
        worker.id === request.workerId
          ? {
              ...worker,
              verification: "Not Yet Verified",
              verificationReviewedAt: reviewedAt,
              verificationReviewedBy: currentUser?.displayName || "Admin",
              verificationRejectionNote: reviewNote,
              profilePhotoPreview: worker.profilePhotoPreview || "",
              verificationNotifications: [
                {
                  id: `rejected-${request.id}`,
                  title: "Verification Rejected",
                  message: reviewNote,
                  date: reviewedAt,
                  unread: true,
                },
              ],
            }
          : worker
      )
    );

    window.alert(`Rejected ${request.workerName}.`);
    setSelectedVerificationRequestId(requestId);
    setView("admin-dashboard");
  }

  return (
    <div className="app-shell">
      <header className="border-bottom bg-white sticky-top">
        <nav className="container navbar navbar-expand-lg py-3">
          <button className="btn btn-link navbar-brand fw-bold text-primary text-decoration-none p-0" onClick={goHome}>
            GawaGo
          </button>
          {view === "home" && (
            <button className="btn btn-outline-primary btn-sm ms-auto" onClick={openLogin}>
              Sign In
            </button>
          )}
        </nav>
      </header>

      <main>
        {view === "home" && (
          <>
            <section className="hero-section">
              <div className="container py-5 py-lg-6">
                <div className="row align-items-center g-4">
                  <div className="col-lg-7">
                    <p className="text-uppercase small fw-semibold text-primary mb-2">Tayabas City</p>
                    <h1 className="display-5 fw-bold mb-3">Find trusted helpers and skilled workers near you.</h1>
                    <p className="lead text-muted mb-4">
                      GawaGo connects households and workers with smart matching, transparent rates, and a fair
                      reputation system.
                    </p>
                    <div className="d-flex gap-2 flex-wrap">
                      <button className="btn btn-primary btn-lg">Post a Job</button>
                      <button className="btn btn-outline-secondary btn-lg">Find Work</button>
                    </div>
                  </div>
                  <div className="col-lg-5">
                    <div className="card shadow-sm border-0">
                      <div className="card-body p-4">
                        <h2 className="h5 fw-semibold mb-3">Live Snapshot</h2>
                        <div className="row g-3">
                          <div className="col-6">
                            <div className="stat-box">
                              <p className="small text-muted mb-1">Open Jobs</p>
                              <p className="h4 mb-0">{dashboardMetrics.openJobs}</p>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="stat-box">
                              <p className="small text-muted mb-1">Verified Workers</p>
                              <p className="h4 mb-0">{dashboardMetrics.verifiedWorkers}</p>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="stat-box">
                              <p className="small text-muted mb-1">Accounts</p>
                              <p className="h4 mb-0">{dashboardMetrics.totalAccounts}</p>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="stat-box">
                              <p className="small text-muted mb-1">Completed Jobs</p>
                              <p className="h4 mb-0">{dashboardMetrics.completedJobs}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="container py-5">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <h3 className="h5">Smart Matching</h3>
                      <p className="text-muted mb-0">
                        Rank workers by skills, schedule, verification status, and location distance.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <h3 className="h5">Trusted Hiring</h3>
                      <p className="text-muted mb-0">
                        Review profiles, ratings, and rates before confirming a worker.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <h3 className="h5">Real-Time Updates</h3>
                      <p className="text-muted mb-0">
                        Track applications, confirmations, and completed jobs from one dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {view === "login" && (
          <section className="login-section py-5">
            <div className="container">
              <h1 className="h3 mb-3">Login</h1>
              <div className="login-shell shadow-sm">
                <div className="login-topbar d-flex align-items-center px-3">
                  <span className="badge rounded-pill text-bg-light text-primary me-2">GG</span>
                  <span className="small fw-semibold">GawaGo Community Platform</span>
                </div>
                <div className="login-card mx-auto">
                  <div className="login-card-head text-center">
                    <div className="login-avatar">GG</div>
                    <h2 className="h6 fw-bold mb-1">GawaGo Community Platform</h2>
                    <p className="small text-white-50 mb-0">Connect workers and households in your community</p>
                  </div>
                  <form className="p-3 p-md-4" onSubmit={handleLoginSubmit}>
                    <div className="mb-3">
                      <label htmlFor="username" className="form-label fw-semibold">
                        Username
                      </label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        className="form-control"
                        placeholder="Enter your username"
                        value={loginForm.username}
                        onChange={handleLoginChange}
                      />
                    </div>
                    <div className="mb-2">
                      <label htmlFor="password" className="form-label fw-semibold">
                        Password
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        className="form-control"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                      />
                    </div>
                    <div className="mb-2">
                      <label htmlFor="role" className="form-label fw-semibold">
                        Login As
                      </label>
                      <select
                        id="role"
                        name="role"
                        className="form-select"
                        value={loginForm.role}
                        onChange={handleLoginChange}
                      >
                        <option value="worker">Worker</option>
                        <option value="household">Household</option>
                      </select>
                    </div>
                    <div className="text-end mb-3">
                      <button type="button" className="btn btn-link btn-sm text-decoration-none p-0">
                        Forgot your password?
                      </button>
                    </div>
                    <button type="submit" className="btn btn-primary w-100">
                      Login
                    </button>
                  </form>
                  <div className="login-card-foot text-center p-3 p-md-4">
                    <p className="small mb-2">New here? Register as:</p>
                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                      <button type="button" className="btn btn-outline-success btn-sm" onClick={openHouseholdRegister}>
                        Household
                      </button>
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={openWorkerRegister}>
                        Worker
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "register-worker" && (
          <section className="login-section py-5">
            <div className="container">
              <h1 className="h3 mb-3">Register as Worker</h1>
              <div className="login-shell shadow-sm">
                <div className="login-topbar d-flex align-items-center px-3">
                  <span className="badge rounded-pill text-bg-light text-primary me-2">GG</span>
                  <span className="small fw-semibold">GawaGo Community Platform</span>
                </div>

                <div className="register-card mx-auto my-4">
                  <div className="register-card-head">
                    <h2 className="h5 mb-0">Register as Worker</h2>
                  </div>

                  <form className="p-3 p-md-4" onSubmit={handleWorkerRegisterSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          className="form-control"
                          value={workerForm.firstName}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          className="form-control"
                          value={workerForm.lastName}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Username</label>
                        <input
                          type="text"
                          name="username"
                          className="form-control"
                          value={workerForm.username}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Email</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          value={workerForm.email}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Phone Number</label>
                        <div className="input-group">
                          <span className="input-group-text">+63</span>
                          <input
                            type="text"
                            name="phone"
                            className="form-control"
                            placeholder="9XXXXXXXXX"
                            value={workerForm.phone}
                            onChange={handleWorkerChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Barangay</label>
                        <select name="barangay" className="form-select" value={workerForm.barangay} onChange={handleWorkerChange}>
                          <option value="">---Select Barangay---</option>
                          {renderBarangayOptions()}
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Street / House No</label>
                        <input
                          type="text"
                          name="streetAddress"
                          className="form-control"
                          placeholder="e.g. 45 Mabini St."
                          value={workerForm.streetAddress}
                          onChange={handleWorkerChange}
                        />
                        <p className="form-text mb-0">Location coverage: Tayabas City, Quezon only.</p>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Bio / About me</label>
                        <textarea
                          name="bio"
                          className="form-control"
                          rows="3"
                          placeholder="Tell households about yourself and your experience..."
                          value={workerForm.bio}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Hourly Rate (PHP)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          name="hourlyRate"
                          className="form-control"
                          value={workerForm.hourlyRate}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Daily Rate (PHP)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          name="dailyRate"
                          className="form-control"
                          value={workerForm.dailyRate}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Years of Experience</label>
                        <input
                          type="number"
                          min="0"
                          name="yearsExperience"
                          className="form-control"
                          value={workerForm.yearsExperience}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">
                          Skills <span className="fw-normal text-muted">(Select all that apply)</span>
                        </label>
                        <div className="skills-grid">
                          {SKILLS.map((skill) => (
                            <label key={skill} className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={workerForm.skills.includes(skill)}
                                onChange={() => toggleSkill(skill)}
                              />
                              <span className="form-check-label">{skill}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Password</label>
                        <input
                          type="password"
                          name="password"
                          className="form-control"
                          value={workerForm.password}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Confirm Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          className="form-control"
                          value={workerForm.confirmPassword}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-12">
                        <button type="submit" className="btn btn-primary w-100">
                          Create Worker Account
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="login-card-foot text-center p-3">
                    <p className="small mb-0">
                      Already have an account?{" "}
                      <button type="button" className="btn btn-link btn-sm align-baseline p-0" onClick={openLogin}>
                        Login here
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "register-household" && (
          <section className="login-section py-5">
            <div className="container">
              <h1 className="h3 mb-3">Register as Household</h1>
              <div className="login-shell shadow-sm">
                <div className="login-topbar d-flex align-items-center px-3">
                  <span className="badge rounded-pill text-bg-light text-primary me-2">GG</span>
                  <span className="small fw-semibold">GawaGo Community Platform</span>
                </div>

                <div className="register-card register-card-sm mx-auto my-4">
                  <div className="register-card-head">
                    <h2 className="h5 mb-0">Register as Household</h2>
                  </div>

                  <form className="p-3 p-md-4" onSubmit={handleHouseholdRegisterSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          className="form-control"
                          value={householdForm.firstName}
                          onChange={handleHouseholdChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          className="form-control"
                          value={householdForm.lastName}
                          onChange={handleHouseholdChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Username</label>
                        <input
                          type="text"
                          name="username"
                          className="form-control"
                          value={householdForm.username}
                          onChange={handleHouseholdChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Email</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          value={householdForm.email}
                          onChange={handleHouseholdChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Phone Number</label>
                        <div className="input-group">
                          <span className="input-group-text">+63</span>
                          <input
                            type="text"
                            name="phone"
                            className="form-control"
                            placeholder="9XXXXXXXXX"
                            value={householdForm.phone}
                            onChange={handleHouseholdChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Barangay</label>
                        <select
                          name="barangay"
                          className="form-select"
                          value={householdForm.barangay}
                          onChange={handleHouseholdChange}
                        >
                          <option value="">---Select Barangay---</option>
                          {renderBarangayOptions()}
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Street / House No</label>
                        <input
                          type="text"
                          name="streetAddress"
                          className="form-control"
                          placeholder="e.g. 45 Mabini St."
                          value={householdForm.streetAddress}
                          onChange={handleHouseholdChange}
                        />
                        <p className="form-text mb-0">Location coverage: Tayabas City, Quezon only.</p>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Password</label>
                        <input
                          type="password"
                          name="password"
                          className="form-control"
                          value={householdForm.password}
                          onChange={handleHouseholdChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Confirm Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          className="form-control"
                          value={householdForm.confirmPassword}
                          onChange={handleHouseholdChange}
                        />
                      </div>
                      <div className="col-12">
                        <button type="submit" className="btn btn-primary w-100">
                          Create Household Account
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="login-card-foot text-center p-3">
                    <p className="small mb-0">
                      Already have an account?{" "}
                      <button type="button" className="btn btn-link btn-sm align-baseline p-0" onClick={openLogin}>
                        Login here
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "worker-dashboard" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item active">Dashboard</button>
                  <button className="worker-nav-item" onClick={openWorkerFindJobs}>
                    Find Jobs
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerProfile}>
                    My Profile
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    My Applications
                    {workerApplicationUnreadCount > 0 && <span className="nav-count-badge">{workerApplicationUnreadCount}</span>}
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>
                    Get Verified
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>
                    Notifications
                    {workerUnreadCount > 0 && <span className="nav-count-badge">{workerUnreadCount}</span>}
                  </button>
                </nav>
              </aside>

              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0">Welcome, {currentUser?.displayName || "Worker"}!</h1>
                  <div className="worker-user-meta d-flex align-items-center gap-2">
                    {workerMiniPhoto ? (
                      <img src={workerMiniPhoto} alt="Worker profile" className="worker-mini-avatar" />
                    ) : (
                      <span className="worker-mini-avatar worker-mini-fallback">
                        {(currentUser?.displayName || "W").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="badge text-bg-primary">Worker</span>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={goBack}>
                      Back
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-6 col-xl-3">
                    <div className="metric-card">
                      <p className="metric-label mb-1">Open Jobs</p>
                      <p className="metric-value mb-0">{workerVisibleJobs.length}</p>
                    </div>
                  </div>
                  <div className="col-md-6 col-xl-3">
                    <div className="metric-card">
                      <p className="metric-label mb-1">Skill Matches</p>
                      <p className="metric-value mb-0">{workerMatchedJobs.length}</p>
                    </div>
                  </div>
                  <div className="col-md-6 col-xl-3">
                    <div className="metric-card">
                      <p className="metric-label mb-1">Your Rating</p>
                      <p className="metric-value mb-0">{currentWorker?.rating || "No ratings yet"}</p>
                    </div>
                  </div>
                  <div className="col-md-6 col-xl-3">
                    <div className="metric-card">
                      <p className="metric-label mb-1">Verification</p>
                      <span
                        className={`badge ${
                          currentWorker?.verification === "Verified" ? "text-bg-success" : "text-bg-warning"
                        }`}
                      >
                        {currentWorker?.verification || "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2 flex-wrap mt-3">
                  <button className="btn btn-primary btn-sm" onClick={openWorkerFindJobs}>
                    Find Jobs
                  </button>
                  <button className="btn btn-outline-primary btn-sm" onClick={openWorkerApplications}>
                    My Applications
                  </button>
                  <button className="btn btn-outline-secondary btn-sm" onClick={openWorkerProfile}>
                    Update Profile
                  </button>
                </div>

                <div className="card border-0 shadow-sm mt-4">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h2 className="h6 mb-0 fw-bold">Latest Household Job Posts</h2>
                    <button className="btn btn-outline-secondary btn-sm" onClick={openWorkerFindJobs}>
                      View All
                    </button>
                  </div>
                  <div className="p-3">
                    {workerVisibleJobs.length > 0 ? (
                      <div className="row g-3">
                        {workerVisibleJobs.slice(0, 3).map((job) => (
                          <div className="col-lg-4" key={job.id}>
                            <article className="job-card">
                              <div className="d-flex justify-content-between align-items-start gap-2">
                                <div>
                                  <h2 className="h5 mb-1">{job.jobTitle || job.serviceType}</h2>
                                  <p className="text-muted mb-1">{job.description || "No description provided."}</p>
                                </div>
                                <span className={`badge ${job.matchesSkill ? "text-bg-primary" : "text-bg-secondary"}`}>
                                  {job.matchesSkill ? "Matches Your Skills" : "Suggested"}
                                </span>
                              </div>
                              <p className="mb-1">{formatLocation(job.barangay, job.streetAddress)}</p>
                              <p className="mb-1">{formatDateTime(job.preferredDate, job.preferredTime)}</p>
                              <p className="mb-1 text-primary">{formatRate(job.offeredRate, job.rateType)}</p>
                              <p className="mb-0">{job.householdName || "Household"}</p>
                            </article>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mb-0 text-muted">Wala pang posted jobs mula sa households.</p>
                    )}
                  </div>
                </div>

                <div className="card border-0 shadow-sm mt-4">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h2 className="h6 mb-0 fw-bold">Recent Applications</h2>
                    <button className="btn btn-outline-secondary btn-sm">View All</button>
                  </div>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Household</th>
                          <th>Distance</th>
                          <th>Status</th>
                          <th>Applied</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-4">
                            No applications yet.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "worker-find-jobs" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>
                    Dashboard
                  </button>
                  <button className="worker-nav-item active">Find Jobs</button>
                  <button className="worker-nav-item" onClick={openWorkerProfile}>
                    My Profile
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    My Applications
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>
                    Get Verified
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>
                    Notifications
                    {workerUnreadCount > 0 && <span className="nav-count-badge">{workerUnreadCount}</span>}
                  </button>
                </nav>
              </aside>

              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0">
                    Available Jobs <span className="badge text-bg-primary">{workerVisibleJobs.length}</span>
                  </h1>
                  <div className="worker-user-meta d-flex align-items-center gap-2">
                    {workerMiniPhoto ? (
                      <img src={workerMiniPhoto} alt="Worker profile" className="worker-mini-avatar" />
                    ) : (
                      <span className="worker-mini-avatar worker-mini-fallback">
                        {(currentUser?.displayName || "W").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="badge text-bg-primary">Worker</span>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={goBack}>
                      Back
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                </div>

                <div className="jobs-filter-panel mt-3">
                  <div className="row g-2 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold mb-1">Filter by Job Type</label>
                      <select className="form-select">
                        <option>All Types</option>
                        <option>House Cleaning</option>
                        <option>Cooking</option>
                        <option>Laundry</option>
                        <option>Gardening</option>
                        <option>Plumbing</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold mb-1">Barangay</label>
                      <input className="form-control" placeholder="e.g. Poblacion" />
                    </div>
                    <div className="col-md-2">
                      <button className="btn btn-primary w-100">Filter</button>
                    </div>
                  </div>
                </div>

                <p className="small text-primary fw-semibold mt-3 mb-2">Jobs matching your skills appear first</p>

                <div className="row g-3">
                  {workerVisibleJobs.length > 0 ? (
                    workerVisibleJobs.map((job) => (
                      <div className="col-lg-6" key={job.id}>
                        <article className="job-card">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h2 className="h5 mb-1">{job.jobTitle || job.serviceType}</h2>
                              <p className="text-muted mb-1">{job.description || "No description provided."}</p>
                            </div>
                            <span className={`badge ${job.matchesSkill ? "text-bg-primary" : "text-bg-secondary"}`}>
                              {job.matchesSkill ? "Matches Your Skills" : "Suggested"}
                            </span>
                          </div>
                          <p className="mb-1">{formatLocation(job.barangay, job.streetAddress)}</p>
                          <p className="mb-1">{formatDateTime(job.preferredDate, job.preferredTime)}</p>
                          <p className="mb-1 text-primary">{formatRate(job.offeredRate, job.rateType)}</p>
                          <p className="mb-3">{job.householdName || "Household"}</p>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-outline-secondary btn-sm flex-fill"
                              type="button"
                              onClick={() => openWorkerJobDetail(job.id)}
                            >
                              View Details
                            </button>
                            <button
                              className="btn btn-primary btn-sm flex-fill"
                              type="button"
                              onClick={() => handleApplyToJob(job.id)}
                            >
                              Apply Now
                            </button>
                          </div>
                        </article>
                      </div>
                    ))
                  ) : (
                    <div className="col-12">
                      <div className="profile-card">
                        <div className="p-4 text-center text-muted">
                          Wala pang household job posts na available ngayon.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "worker-job-detail" && currentWorkerJobDetail && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>
                    Dashboard
                  </button>
                  <button className="worker-nav-item active" onClick={openWorkerFindJobs}>
                    Find Jobs
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerProfile}>
                    My Profile
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    My Applications
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>
                    Get Verified
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>
                    Notifications
                    {workerUnreadCount > 0 && <span className="nav-count-badge">{workerUnreadCount}</span>}
                  </button>
                </nav>
              </aside>

              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0">Job Details</h1>
                  <div className="worker-user-meta d-flex align-items-center gap-2">
                    {workerMiniPhoto ? (
                      <img src={workerMiniPhoto} alt="Worker profile" className="worker-mini-avatar" />
                    ) : (
                      <span className="worker-mini-avatar worker-mini-fallback">
                        {(currentUser?.displayName || "W").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="badge text-bg-primary">Worker</span>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={openWorkerFindJobs}>
                      Back
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-lg-5">
                    <div className="profile-card h-100">
                      <div className="profile-card-head">Household Information</div>
                      <div className="p-4">
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <div className="profile-avatar">
                            {(currentWorkerJobDetail.householdName || "H").slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <h2 className="h5 mb-1">{currentWorkerJobDetail.householdName || "Household"}</h2>
                            <p className="mb-0 text-muted">
                              {currentWorkerJobDetail.householdUsername ? `@${currentWorkerJobDetail.householdUsername}` : "Household account"}
                            </p>
                          </div>
                        </div>

                        <p className="mb-2 small d-flex justify-content-between">
                          <span>Location</span>
                          <strong>{formatLocation(currentWorkerJobDetail.barangay, currentWorkerJobDetail.streetAddress)}</strong>
                        </p>
                        <p className="mb-2 small d-flex justify-content-between">
                          <span>Job Type</span>
                          <strong>{currentWorkerJobDetail.serviceType || "N/A"}</strong>
                        </p>
                        <p className="mb-2 small d-flex justify-content-between">
                          <span>Schedule</span>
                          <strong>{formatScheduleLabel(currentWorkerJobDetail.scheduleType)}</strong>
                        </p>
                        <p className="mb-2 small d-flex justify-content-between">
                          <span>Date & Time</span>
                          <strong>{formatDateTime(currentWorkerJobDetail.preferredDate, currentWorkerJobDetail.preferredTime)}</strong>
                        </p>
                        <p className="mb-0 small d-flex justify-content-between">
                          <span>Offered Rate</span>
                          <strong>{formatRate(currentWorkerJobDetail.offeredRate, currentWorkerJobDetail.rateType)}</strong>
                        </p>

                        <div className="mt-4">
                          <button
                            className="btn btn-primary w-100"
                            type="button"
                            onClick={() => handleApplyToJob(currentWorkerJobDetail.id)}
                          >
                            Apply Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-7">
                    <div className="profile-card mb-3">
                      <div className="profile-card-head">Job Description</div>
                      <div className="p-3">
                        <p className="mb-0">{currentWorkerJobDetail.description || "No description provided."}</p>
                      </div>
                    </div>

                    <div className="profile-card mb-3">
                      <div className="profile-card-head">Job Summary</div>
                      <div className="p-3 d-grid gap-2">
                        <div className="verification-note">
                          <p className="small fw-semibold mb-1">Title</p>
                          <p className="mb-0">{currentWorkerJobDetail.jobTitle || currentWorkerJobDetail.serviceType}</p>
                        </div>
                        <div className="verification-note">
                          <p className="small fw-semibold mb-1">Service Type</p>
                          <p className="mb-0">{currentWorkerJobDetail.serviceType}</p>
                        </div>
                        <div className="verification-note">
                          <p className="small fw-semibold mb-1">Status</p>
                          <p className="mb-0">{currentWorkerJobDetail.status}</p>
                        </div>
                      </div>
                    </div>

                    <div className="profile-card">
                      <div className="profile-card-head">Household Note</div>
                      <div className="p-3">
                        <p className="mb-0">
                          This job was posted by the household account. Review the details above before applying.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "worker-profile" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>
                    Dashboard
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerFindJobs}>
                    Find Jobs
                  </button>
                  <button className="worker-nav-item active">My Profile</button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    My Applications
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>
                    Get Verified
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>
                    Notifications
                  </button>
                </nav>
              </aside>

              <div className="worker-content">
                <div className="row g-3">
                  <div className="col-lg-4">
                    <div className="profile-card">
                      <div className="profile-card-head">My Profile</div>
                      <div className="p-3 text-center">
                        {workerMiniPhoto ? (
                          <img src={workerMiniPhoto} alt="Worker profile" className="profile-photo-large mb-2" />
                        ) : (
                          <div className="profile-avatar mb-2">
                            {(workerProfileForm.firstName || "W").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <h2 className="h5 mb-1">
                          {getDisplayName(
                            workerProfileForm.firstName,
                            workerProfileForm.lastName,
                            workerProfileForm.username
                          )}
                        </h2>
                        <p className="text-muted mb-2">@{workerProfileForm.username || "worker"}</p>
                        <span className="badge text-bg-primary">Worker</span>
                      </div>
                      <div className="px-3 pb-3">
                        <p className="mb-1 small">
                          <strong>Barangay:</strong> {workerProfileForm.barangay || "Not set"}
                        </p>
                        <p className="mb-1 small">
                          <strong>Phone:</strong> {workerProfileForm.phone || "Not set"}
                        </p>
                        <p className="mb-2 small">
                          <strong>Email:</strong> {workerProfileForm.email || "Not set"}
                        </p>
                        <hr className="my-2" />
                        <p className="mb-1 small">
                          <strong>Verification:</strong> <span className="badge text-bg-warning">Pending</span>
                        </p>
                        <p className="mb-1 small">
                          <strong>Rating:</strong> 5.00
                        </p>
                        <p className="mb-1 small">
                          <strong>Jobs Done:</strong> 3
                        </p>
                        <p className="mb-1 small">
                          <strong>Hourly Rate:</strong> PHP {workerProfileForm.hourlyRate || "0.00"}
                        </p>
                        <p className="mb-2 small">
                          <strong>Daily Rate:</strong> PHP {workerProfileForm.dailyRate || "0.00"}
                        </p>
                        <div className="d-flex gap-1 flex-wrap">
                          {(workerProfileForm.skills || []).length === 0 ? (
                            <span className="badge text-bg-secondary">No skills selected yet</span>
                          ) : (
                            workerProfileForm.skills.map((skill) => (
                              <span key={skill} className="badge text-bg-primary">
                                {skill}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-8">
                    <div className="profile-card">
                      <div className="profile-card-head">Edit Profile Information</div>
                      <form className="p-3" onSubmit={handleWorkerProfileSave}>
                        <h3 className="h6 fw-bold mb-2">Profile Photo</h3>
                        <div className="mb-3">
                          <input
                            type="file"
                            className="form-control"
                            name="profilePhoto"
                            accept="image/*"
                            onChange={handleWorkerProfileChange}
                          />
                          <p className="form-text mb-0">Accepted: JPG, PNG. Clear face photo recommended.</p>
                          {workerProfileForm.profilePhotoPreview && (
                            <img
                              src={workerProfileForm.profilePhotoPreview}
                              alt="Worker profile preview"
                              className="img-fluid rounded border mt-2"
                            />
                          )}
                        </div>

                        <h3 className="h6 fw-bold mb-2">Personal Information</h3>
                        <div className="row g-2 mb-3">
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-1">First Name</label>
                            <input
                              name="firstName"
                              className="form-control"
                              value={workerProfileForm.firstName}
                              onChange={handleWorkerProfileChange}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-1">Last Name</label>
                            <input
                              name="lastName"
                              className="form-control"
                              value={workerProfileForm.lastName}
                              onChange={handleWorkerProfileChange}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-1">Email</label>
                            <input
                              type="email"
                              name="email"
                              className="form-control"
                              value={workerProfileForm.email}
                              onChange={handleWorkerProfileChange}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-1">Phone Number</label>
                            <input
                              name="phone"
                              className="form-control"
                              value={workerProfileForm.phone}
                              onChange={handleWorkerProfileChange}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-1">Barangay</label>
                            <select
                              name="barangay"
                              className="form-select"
                              value={workerProfileForm.barangay}
                              onChange={handleWorkerProfileChange}
                            >
                              <option value="">---Select Barangay---</option>
                              {renderBarangayOptions()}
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-1">Street / House No.</label>
                            <input
                              name="streetAddress"
                              className="form-control"
                              value={workerProfileForm.streetAddress}
                              onChange={handleWorkerProfileChange}
                            />
                          </div>
                        </div>

                        <h3 className="h6 fw-bold mb-2">Worker Information</h3>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold mb-1">Bio / About Me</label>
                          <textarea
                            name="bio"
                            className="form-control"
                            rows="3"
                            value={workerProfileForm.bio}
                            onChange={handleWorkerProfileChange}
                          />
                        </div>
                        <div className="row g-2 mb-3">
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold mb-1">Availability</label>
                            <div className="form-check mt-1">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="availability"
                                name="availability"
                                checked={workerProfileForm.availability}
                                onChange={handleWorkerProfileChange}
                              />
                              <label className="form-check-label" htmlFor="availability">
                                Available
                              </label>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold mb-1">Hourly Rate (PHP)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              name="hourlyRate"
                              className="form-control"
                              value={workerProfileForm.hourlyRate}
                              onChange={handleWorkerProfileChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold mb-1">Daily Rate (PHP)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              name="dailyRate"
                              className="form-control"
                              value={workerProfileForm.dailyRate}
                              onChange={handleWorkerProfileChange}
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Skills <span className="fw-normal text-muted">(Select all that apply)</span>
                          </label>
                          <div className="skills-grid">
                            {SKILLS.map((skill) => (
                              <label key={skill} className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={workerProfileForm.skills.includes(skill)}
                                  onChange={() => toggleWorkerProfileSkill(skill)}
                                />
                                <span className="form-check-label">{skill}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button className="btn btn-primary" type="submit">
                            Save Changes
                          </button>
                          <button className="btn btn-outline-secondary" type="button" onClick={openWorkerDashboard}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "worker-applications" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>
                    Dashboard
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerFindJobs}>
                    Find Jobs
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerProfile}>
                    My Profile
                  </button>
                  <button className="worker-nav-item active">
                    My Applications
                    {workerApplicationUnreadCount > 0 && <span className="nav-count-badge">{workerApplicationUnreadCount}</span>}
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>
                    Get Verified
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>
                    Notifications
                  </button>
                </nav>
              </aside>

              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0">My Applications</h1>
                  <div className="worker-user-meta d-flex align-items-center gap-2">
                    {workerMiniPhoto ? (
                      <img src={workerMiniPhoto} alt="Worker profile" className="worker-mini-avatar" />
                    ) : (
                      <span className="worker-mini-avatar worker-mini-fallback">
                        {(currentUser?.displayName || "W").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="badge text-bg-primary">Worker</span>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                </div>

                <div className="applications-filter mt-3">
                  <div className="row g-2">
                    <div className="col-md-4">
                      <select className="form-select">
                        <option>All Status</option>
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <button className="btn btn-primary w-100">Filter</button>
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow-sm mt-3">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Job</th>
                          <th>Household</th>
                          <th>Distance</th>
                          <th>Rate</th>
                          <th>Status</th>
                          <th>Applied</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workerApplications.length > 0 ? (
                          workerApplications.map((job) => (
                            <tr key={`${job.id}-${job.appliedAt}`}>
                              <td>{job.jobTitle || job.serviceType}</td>
                              <td>{job.householdName || "Household"}</td>
                              <td>{formatLocation(job.barangay, job.streetAddress)}</td>
                              <td>{formatRate(job.offeredRate, job.rateType)}</td>
                              <td>{job.applicationStatus || "Pending"}</td>
                              <td>{job.appliedAt}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center text-muted py-4">
                              No applications yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "worker-get-verified" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>
                    Dashboard
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerFindJobs}>
                    Find Jobs
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerProfile}>
                    My Profile
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    My Applications
                    {workerApplicationUnreadCount > 0 && <span className="nav-count-badge">{workerApplicationUnreadCount}</span>}
                  </button>
                  <button className="worker-nav-item active">Get Verified</button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>
                    Notifications
                  </button>
                </nav>
              </aside>

              <div className="worker-content">
                {currentWorker?.verification === "Verified" ? (
                  <div className="profile-card mt-3">
                    <div className="profile-card-head">Get Verified</div>
                    <div className="p-4">
                      <div className="verification-note mb-3">
                        <h2 className="h5 mb-2">You're already verified</h2>
                        <p className="mb-0">
                          Your verification is already approved by the admin, so the details below are now read-only.
                        </p>
                      </div>

                      {currentWorker.verificationSubmission && (
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="verification-note h-100">
                              <p className="small fw-semibold mb-1">Primary ID</p>
                              <p className="mb-1 small">{currentWorker.verificationSubmission.primaryIdName}</p>
                              {currentWorker.verificationSubmission.primaryIdPreview && (
                                <img
                                  src={currentWorker.verificationSubmission.primaryIdPreview}
                                  alt="Primary ID"
                                  className="img-fluid rounded border mt-2"
                                />
                              )}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="verification-note h-100">
                              <p className="small fw-semibold mb-1">Supporting Document</p>
                              <p className="mb-1 small">{currentWorker.verificationSubmission.secondaryDocName}</p>
                              {currentWorker.verificationSubmission.secondaryDocPreview && (
                                <img
                                  src={currentWorker.verificationSubmission.secondaryDocPreview}
                                  alt="Supporting document"
                                  className="img-fluid rounded border mt-2"
                                />
                              )}
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="verification-note">
                              <p className="small fw-semibold mb-1">Admin Note</p>
                              <p className="mb-0 small">
                                {currentWorker.verificationReviewedBy
                                  ? `Verified by ${currentWorker.verificationReviewedBy} on ${currentWorker.verificationReviewedAt}.`
                                  : "Verified by admin."}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="d-flex gap-2 mt-3">
                        <button type="button" className="btn btn-outline-secondary" onClick={openWorkerDashboard}>
                          Back
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="verification-wrap">
                    <div className="verification-card">
                      <div className="verification-card-head">Submit Verification Documents</div>
                      <form className="p-3 p-md-4" onSubmit={handleVerificationSubmit}>
                        <div className="verification-note mb-3">
                          <p className="mb-0 small">
                            <strong>Why get verified?</strong> Verified workers appear higher in smart matching and
                            help households trust your profile faster.
                          </p>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Primary ID Document</label>
                          <input
                            type="file"
                            className="form-control"
                            name="primaryId"
                            onChange={handleVerificationChange}
                          />
                          <p className="form-text mb-0">
                            Accepted: Government-issued ID (SSS, GSIS, Passport, etc.)
                          </p>
                          {verificationForm.primaryIdName && (
                            <p className="small text-muted mt-1 mb-0">Selected: {verificationForm.primaryIdName}</p>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Supporting Document</label>
                          <input
                            type="file"
                            className="form-control"
                            name="secondaryDoc"
                            onChange={handleVerificationChange}
                          />
                          <p className="form-text mb-0">
                            Accepted: Barangay clearance, NBI clearance, certificate of employment, etc.
                          </p>
                          {verificationForm.secondaryDocName && (
                            <p className="small text-muted mt-1 mb-0">Selected: {verificationForm.secondaryDocName}</p>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Additional Notes (Optional)</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            name="notes"
                            placeholder="Add any notes about your submitted documents..."
                            value={verificationForm.notes}
                            onChange={handleVerificationChange}
                          />
                        </div>

                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-primary">
                            Submit Documents
                          </button>
                          <button type="button" className="btn btn-outline-secondary" onClick={openWorkerDashboard}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {view === "worker-notifications" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>
                    Dashboard
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerFindJobs}>
                    Find Jobs
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerProfile}>
                    My Profile
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    My Applications
                    {workerApplicationUnreadCount > 0 && <span className="nav-count-badge">{workerApplicationUnreadCount}</span>}
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>
                    Get Verified
                  </button>
                  <button className="worker-nav-item active">Notifications</button>
                </nav>
              </aside>

              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0">Notifications</h1>
                  <div className="worker-user-meta d-flex align-items-center gap-2">
                    {workerMiniPhoto ? (
                      <img src={workerMiniPhoto} alt="Worker profile" className="worker-mini-avatar" />
                    ) : (
                      <span className="worker-mini-avatar worker-mini-fallback">
                        {(currentUser?.displayName || "W").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="badge text-bg-primary">Worker</span>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={goBack}>
                      Back
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-3">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => markAllNotificationsRead(workerNotificationsWithReadState)}
                  >
                    Mark All as Read
                  </button>
                </div>
                <div className="mt-3 d-grid gap-2">
                  {workerNotificationsWithReadState.map((item) => (
                    <article
                      className={`notification-card ${item.unread ? "unread" : ""}`}
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => markNotificationRead(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          markNotificationRead(item.id);
                        }
                      }}
                    >
                      <p className="small text-muted mb-1">{item.date}</p>
                      <h2 className="h6 mb-1">{item.title}</h2>
                      <p className="mb-0">{item.message}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "admin-dashboard" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">Admin Panel</p>
                </div>
                <nav className="worker-nav">
                  <button
                    className={`worker-nav-item ${adminSection === "verification" ? "active" : ""}`}
                    onClick={openAdminDashboard}
                  >
                    Verification Queue
                  </button>
                  <button
                    className={`worker-nav-item ${adminSection === "history" ? "active" : ""}`}
                    onClick={openAdminWorkersHistory}
                  >
                    Workers History
                  </button>
                </nav>
              </aside>

              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0">
                    {adminSection === "history" ? "Workers History" : "Verification Dashboard"}
                  </h1>
                  <div className="worker-user-meta d-flex align-items-center gap-2">
                    <span className="badge text-bg-dark">Admin</span>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={goBack}>
                      Back
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                </div>

                {adminSection === "verification" ? (
                  <>
                    <div className="row g-3 mt-1">
                      <div className="col-md-6 col-xl-3">
                        <div className="metric-card">
                          <p className="metric-label mb-1">Pending</p>
                          <p className="metric-value mb-0">{pendingVerificationRequests.length}</p>
                        </div>
                      </div>
                      <div className="col-md-6 col-xl-3">
                        <div className="metric-card">
                          <p className="metric-label mb-1">Under Review</p>
                          <p className="metric-value mb-0">
                            {verificationRequests.filter((item) => item.status === "Under Review").length}
                          </p>
                        </div>
                      </div>
                      <div className="col-md-6 col-xl-3">
                        <div className="metric-card">
                          <p className="metric-label mb-1">Approved</p>
                          <p className="metric-value mb-0">{approvedVerificationRequests.length}</p>
                        </div>
                      </div>
                      <div className="col-md-6 col-xl-3">
                        <div className="metric-card">
                          <p className="metric-label mb-1">Rejected</p>
                          <p className="metric-value mb-0">{rejectedVerificationRequests.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="card border-0 shadow-sm mt-4">
                      <div className="card-header bg-white d-flex justify-content-between align-items-center">
                        <h2 className="h6 mb-0 fw-bold">Worker Verification Requests</h2>
                        <span className="small text-muted">{verificationRequests.length} total</span>
                      </div>
                      {selectedVerificationRequest && (
                        <div className="p-3 border-bottom bg-light">
                          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                            <div>
                              <h3 className="h6 mb-1">{selectedVerificationRequest.workerName}</h3>
                              <p className="small text-muted mb-0">@{selectedVerificationRequest.workerUsername}</p>
                            </div>
                            <span
                              className={`badge ${
                                selectedVerificationRequest.status === "Approved"
                                  ? "text-bg-success"
                                  : selectedVerificationRequest.status === "Rejected"
                                  ? "text-bg-danger"
                                  : "text-bg-warning"
                              }`}
                            >
                              {selectedVerificationRequest.status}
                            </span>
                          </div>
                          <div className="row g-2 mt-2">
                            {selectedVerificationRequest.primaryIdPreview && (
                              <div className="col-md-6">
                                <div className="verification-note h-100">
                                  <p className="small fw-semibold mb-2">Primary ID Preview</p>
                                  <button
                                    type="button"
                                    className="btn btn-link p-0 border-0"
                                    onClick={() => openFilePreview(selectedVerificationRequest.primaryIdPreview)}
                                  >
                                    <img
                                      src={selectedVerificationRequest.primaryIdPreview}
                                      alt="Primary ID preview"
                                      className="img-fluid rounded border"
                                    />
                                  </button>
                                </div>
                              </div>
                            )}
                            {selectedVerificationRequest.secondaryDocPreview && (
                              <div className="col-md-6">
                                <div className="verification-note h-100">
                                  <p className="small fw-semibold mb-2">Supporting Doc Preview</p>
                                  <a
                                    href={selectedVerificationRequest.secondaryDocPreview}
                                    download={selectedVerificationRequest.secondaryDocName || "supporting-doc"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="d-inline-block"
                                  >
                                    <img
                                      src={selectedVerificationRequest.secondaryDocPreview}
                                      alt="Supporting document preview"
                                      className="img-fluid rounded border"
                                    />
                                  </a>
                                  <p className="small text-muted mb-0 mt-2">Click to download the file.</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="p-3 d-grid gap-3">
                        {verificationRequests.length > 0 ? (
                          verificationRequests.map((request) => (
                            <article
                              className={`verification-admin-card ${
                                selectedVerificationRequestId === request.id ? "selected" : ""
                              }`}
                              key={request.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => openVerificationRequest(request.id)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  openVerificationRequest(request.id);
                                }
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                                <div>
                                  <h3 className="h6 mb-1">{request.workerName}</h3>
                                  <p className="small text-muted mb-1">@{request.workerUsername}</p>
                                  <p className="small mb-1">
                                    <strong>Status:</strong> {request.status}
                                  </p>
                                  <p className="small mb-1">
                                    <strong>Submitted:</strong> {request.submittedAt}
                                  </p>
                                  {request.reviewedAt && (
                                    <p className="small mb-1">
                                      <strong>Reviewed:</strong> {request.reviewedAt}
                                    </p>
                                  )}
                                  {request.reviewNote && (
                                    <p className="small mb-0">
                                      <strong>Admin Note:</strong> {request.reviewNote}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`badge ${
                                    request.status === "Approved"
                                      ? "text-bg-success"
                                      : request.status === "Rejected"
                                      ? "text-bg-danger"
                                      : "text-bg-warning"
                                  }`}
                                >
                                  {request.status}
                                </span>
                              </div>

                              <div className="row g-2 mt-2">
                                <div className="col-md-4">
                                  <div className="verification-note h-100">
                                    <p className="small fw-semibold mb-1">Primary ID</p>
                                    <p className="mb-0 small">{request.primaryIdName}</p>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="verification-note h-100">
                                    <p className="small fw-semibold mb-1">Supporting Doc</p>
                                    <p className="mb-0 small">{request.secondaryDocName}</p>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="verification-note h-100">
                                    <p className="small fw-semibold mb-1">Notes</p>
                                    <p className="mb-0 small">{request.notes || "No additional notes provided."}</p>
                                  </div>
                                </div>
                              </div>

                              {request.status === "Pending" || request.status === "Under Review" ? (
                                <div className="d-flex gap-2 mt-3 flex-wrap">
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleAdminApproveVerification(request.id)}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleAdminRejectVerification(request.id)}
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : null}
                            </article>
                          ))
                        ) : (
                          <div className="text-center text-muted py-4">No verification requests yet.</div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="card border-0 shadow-sm mt-4">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                      <h2 className="h6 mb-0 fw-bold">Workers History</h2>
                      <span className="small text-muted">Verified and submitted workers</span>
                    </div>
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Worker</th>
                            <th>Verification</th>
                            <th>Submitted</th>
                            <th>Reviewed By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminVisibleWorkers.length > 0 ? (
                            adminVisibleWorkers.map((worker) => (
                              <tr key={worker.id}>
                                <td>{getDisplayName(worker.firstName, worker.lastName, worker.username)}</td>
                                <td>
                                  <span
                                    className={`badge ${
                                      worker.verification === "Verified"
                                        ? "text-bg-success"
                                        : worker.verification === "Under Review"
                                        ? "text-bg-warning"
                                        : "text-bg-secondary"
                                    }`}
                                  >
                                    {worker.verification || "Not Yet Verified"}
                                  </span>
                                </td>
                                <td>{worker.verificationSubmission?.submittedAt || "None"}</td>
                                <td>{worker.verificationReviewedBy || "None"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center text-muted py-4">
                                No verified or registered workers to display.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {view === "household-post-job" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    Dashboard
                  </button>
                  <button className="worker-nav-item active">Post a Job</button>
                  <button className="worker-nav-item" onClick={openHouseholdMyJobs}>
                    My Jobs
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdProfile}>
                    My Profile
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdNotifications}>
                    Notifications
                  </button>
                </nav>
              </aside>

              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0">Post a New Job</h1>
                  <div className="worker-user-meta d-flex align-items-center gap-2">
                    <span className="small fw-semibold">{currentUser?.displayName || "Household"}</span>
                    <span className="badge text-bg-primary">Household</span>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={goBack}>
                      Back
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                </div>

                <div className="profile-card mt-3">
                  <div className="profile-card-head">Post a New Job</div>
                  <form className="p-3 p-md-4" onSubmit={handleHouseholdJobSubmit}>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-semibold">Job Title</label>
                        <input
                          type="text"
                          name="jobTitle"
                          className="form-control"
                          placeholder="e.g. House Cleaning - 3 Bedroom"
                          value={householdJobForm.jobTitle}
                          onChange={handleHouseholdJobChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Service Type</label>
                        <select
                          name="serviceType"
                          className="form-select"
                          value={householdJobForm.serviceType}
                          onChange={handleHouseholdJobChange}
                        >
                          <option value="">---Select Service---</option>
                          {SKILLS.map((skill) => (
                            <option key={skill} value={skill}>
                              {skill}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Schedule Type</label>
                        <select
                          name="scheduleType"
                          className="form-select"
                          value={householdJobForm.scheduleType}
                          onChange={handleHouseholdJobChange}
                        >
                          <option>One - Time</option>
                          <option>Part-Time</option>
                          <option>Full-Time</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Preferred Date</label>
                        <input
                          type="date"
                          name="preferredDate"
                          className="form-control"
                          value={householdJobForm.preferredDate}
                          onChange={handleHouseholdJobChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Preferred Time</label>
                        <input
                          type="time"
                          name="preferredTime"
                          className="form-control"
                          value={householdJobForm.preferredTime}
                          onChange={handleHouseholdJobChange}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Job Description</label>
                        <textarea
                          name="description"
                          className="form-control"
                          rows="3"
                          placeholder="Describe the job in detail..."
                          value={householdJobForm.description}
                          onChange={handleHouseholdJobChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Barangay</label>
                        <select name="barangay" className="form-select" value={householdJobForm.barangay} onChange={handleHouseholdJobChange}>
                          <option value="">---Select Barangay---</option>
                          {renderBarangayOptions()}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Street / House No.</label>
                        <input
                          type="text"
                          name="streetAddress"
                          className="form-control"
                          value={householdJobForm.streetAddress}
                          onChange={handleHouseholdJobChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Offered Rate (PHP)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          name="offeredRate"
                          className="form-control"
                          value={householdJobForm.offeredRate}
                          onChange={handleHouseholdJobChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Rate Type</label>
                        <select
                          name="rateType"
                          className="form-select"
                          value={householdJobForm.rateType}
                          onChange={handleHouseholdJobChange}
                        >
                          <option>Per Day</option>
                          <option>Per Hour</option>
                          <option>Fixed Rate</option>
                        </select>
                      </div>
                      <div className="col-12 d-flex gap-2">
                        <button type="submit" className="btn btn-primary">
                          Post Job
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={openHouseholdDashboard}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "household-profile" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    Dashboard
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    Post a Job
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdMyJobs}>
                    My Jobs
                  </button>
                  <button className="worker-nav-item active">My Profile</button>
                  <button className="worker-nav-item" onClick={openHouseholdNotifications}>
                    Notifications
                  </button>
                </nav>
              </aside>

              <div className="worker-content">
                <div className="row g-3">
                  <div className="col-lg-4">
                    <div className="profile-card">
                      <div className="profile-card-head">My Profile</div>
                      <div className="p-3 text-center">
                        {householdProfileForm.profilePhotoPreview ? (
                          <img
                            src={householdProfileForm.profilePhotoPreview}
                            alt="Household profile"
                            className="profile-photo-large mb-2"
                          />
                        ) : (
                          <div className="profile-avatar mb-2">
                            {(householdProfileForm.firstName || "H").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <h2 className="h5 mb-1">
                          {getDisplayName(
                            householdProfileForm.firstName,
                            householdProfileForm.lastName,
                            householdProfileForm.username
                          )}
                        </h2>
                        <p className="text-muted mb-2">@{householdProfileForm.username || "household"}</p>
                        <span className="badge text-bg-primary">Household</span>
                      </div>
                      <div className="px-3 pb-3">
                        <p className="mb-1 small">
                          <strong>Barangay:</strong> {householdProfileForm.barangay || "Not set"}
                        </p>
                        <p className="mb-1 small">
                          <strong>Phone:</strong> {householdProfileForm.phone || "Not set"}
                        </p>
                        <p className="mb-2 small">
                          <strong>Email:</strong> {householdProfileForm.email || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-8">
                    <div className="profile-card">
                      <div className="profile-card-head">Edit Profile Information</div>
                      <form className="p-3" onSubmit={handleHouseholdProfileSave}>
                        <h3 className="h6 fw-bold mb-2">Profile Photo</h3>
                        <div className="mb-3">
                          <input
                            type="file"
                            className="form-control"
                            name="profilePhoto"
                            accept="image/*"
                            onChange={handleHouseholdProfileChange}
                          />
                          <p className="form-text mb-0">Accepted: JPG, PNG. Use a clear profile photo.</p>
                          {householdProfileForm.profilePhotoPreview && (
                            <img
                              src={householdProfileForm.profilePhotoPreview}
                              alt="Household profile preview"
                              className="img-fluid rounded border mt-2"
                            />
                          )}
                        </div>

                        <div className="row g-2 mb-3">
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-1">First Name</label>
                            <input
                              type="text"
                              name="firstName"
                              className="form-control"
                              value={householdProfileForm.firstName}
                              onChange={handleHouseholdProfileChange}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-1">Last Name</label>
                            <input
                              type="text"
                              name="lastName"
                              className="form-control"
                              value={householdProfileForm.lastName}
                              onChange={handleHouseholdProfileChange}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-1">Username</label>
                            <input
                              type="text"
                              name="username"
                              className="form-control"
                              value={householdProfileForm.username}
                              disabled
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-1">Email</label>
                            <input
                              type="email"
                              name="email"
                              className="form-control"
                              value={householdProfileForm.email}
                              onChange={handleHouseholdProfileChange}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-1">Phone Number</label>
                            <input
                              type="text"
                              name="phone"
                              className="form-control"
                              value={householdProfileForm.phone}
                              onChange={handleHouseholdProfileChange}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-1">Barangay</label>
                            <select
                              name="barangay"
                              className="form-select"
                              value={householdProfileForm.barangay}
                              onChange={handleHouseholdProfileChange}
                            >
                              <option value="">---Select Barangay---</option>
                              {renderBarangayOptions()}
                            </select>
                          </div>
                          <div className="col-12">
                            <label className="form-label small fw-semibold mb-1">Street / House No.</label>
                            <input
                              type="text"
                              name="streetAddress"
                              className="form-control"
                              value={householdProfileForm.streetAddress}
                              onChange={handleHouseholdProfileChange}
                            />
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button className="btn btn-primary" type="submit">
                            Save Profile
                          </button>
                          <button className="btn btn-outline-secondary" type="button" onClick={openHouseholdDashboard}>
                            Back to Dashboard
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "household-my-jobs" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    Dashboard
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    Post a Job
                  </button>
                  <button className="worker-nav-item active">My Jobs</button>
                  <button className="worker-nav-item" onClick={openHouseholdProfile}>
                    My Profile
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdNotifications}>
                    Notifications
                  </button>
                </nav>
              </aside>

              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0">My Jobs</h1>
                  <div className="worker-user-meta d-flex align-items-center gap-2">
                    <span className="small fw-semibold">{currentUser?.displayName || "Household"}</span>
                    <span className="badge text-bg-primary">Household</span>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={goBack}>
                      Back
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                </div>

                {!householdJobs.length && (
                  <div className="profile-card mt-3">
                    <div className="p-4 text-center">
                      <h2 className="h5 mb-2">No job posts yet</h2>
                      <p className="text-muted mb-3">
                        Kapag nag-post ka ng job, lalabas dito ang details at matched workers.
                      </p>
                      <button className="btn btn-primary" onClick={openHouseholdPostJob}>
                        Post a New Job
                      </button>
                    </div>
                  </div>
                )}

                {householdJobs.length > 0 && selectedJob && (
                  <>
                    <div className="my-jobs-list mt-3">
                      {householdJobs.map((job) => (
                        <button
                          key={job.id}
                          type="button"
                          className={`job-summary-card ${selectedJob.id === job.id ? "active" : ""}`}
                          onClick={() => openHouseholdJobDetail(job.id)}
                        >
                          <div>
                            <p className="job-summary-title mb-1">{job.jobTitle || job.serviceType}</p>
                            <p className="job-summary-meta mb-0">
                              {job.serviceType} • {formatLocation(job.barangay, job.streetAddress)}
                            </p>
                          </div>
                          <span className={`badge ${job.status === "Cancelled" ? "text-bg-danger" : "text-bg-primary"}`}>
                            {job.status}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="my-jobs-card mt-3">
                      <div className="my-jobs-card-head d-flex justify-content-between align-items-center">
                        <h2 className="h6 fw-bold mb-0">{selectedJob.jobTitle || selectedJob.serviceType}</h2>
                        <span
                          className={`badge ${
                            selectedJob.status === "Cancelled" ? "text-bg-danger" : "text-bg-primary"
                          }`}
                        >
                          {selectedJob.status}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="row g-3">
                          <div className="col-md-3">
                            <p className="small text-muted mb-1">Service Type</p>
                            <p className="mb-0 fw-semibold">{selectedJob.serviceType}</p>
                          </div>
                          <div className="col-md-3">
                            <p className="small text-muted mb-1">Schedule</p>
                            <p className="mb-0 fw-semibold">{formatScheduleLabel(selectedJob.scheduleType)}</p>
                          </div>
                          <div className="col-md-3">
                            <p className="small text-muted mb-1">Date & Time</p>
                            <p className="mb-0 fw-semibold">
                              {formatDateTime(selectedJob.preferredDate, selectedJob.preferredTime)}
                            </p>
                          </div>
                          <div className="col-md-3">
                            <p className="small text-muted mb-1">Offered Rate</p>
                            <p className="mb-0 fw-semibold text-primary">
                              {formatRate(selectedJob.offeredRate, selectedJob.rateType)}
                            </p>
                          </div>
                          <div className="col-md-3">
                            <p className="small text-muted mb-1">Location</p>
                            <p className="mb-0 fw-semibold">
                              {formatLocation(selectedJob.barangay, selectedJob.streetAddress)}
                            </p>
                          </div>
                          <div className="col-md-9">
                            <p className="small text-muted mb-1">Description</p>
                            <p className="mb-0 fw-semibold">
                              {selectedJob.description || "No description provided."}
                            </p>
                          </div>
                        </div>
                        {selectedJob.status !== "Cancelled" && (
                          <button
                            className="btn btn-outline-danger btn-sm mt-3"
                            type="button"
                            onClick={() => handleCancelJob(selectedJob.id)}
                          >
                            Cancel Job
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="my-jobs-card mt-3">
                      <div className="my-jobs-card-head d-flex justify-content-between align-items-center">
                        <h2 className="h6 fw-bold mb-0">Smart Matched Workers</h2>
                        <span className="fw-semibold small">{selectedMatchedWorkers.length} worker(s) found</span>
                      </div>
                      <div className="small px-3 py-2 border-bottom bg-light">
                        I-click ang worker para makita ang buong profile at description.
                      </div>

                      <div className="p-2 p-md-3 d-grid gap-2">
                        {selectedMatchedWorkers.map((worker, index) => (
                          <button
                            type="button"
                            className="matched-worker-item matched-worker-button"
                            key={worker.id}
                            onClick={() => openMatchedWorkerProfile(worker.id, selectedJob.id)}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <span className="match-rank">{index + 1}</span>
                              <div className="profile-avatar match-avatar">
                                {(worker.avatar || worker.firstName || worker.username || "W")
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </div>
                              <div className="flex-grow-1 text-start">
                                <p className="mb-1 fw-semibold">
                                  {getDisplayName(worker.firstName, worker.lastName, worker.username)}
                                </p>
                                <div className="d-flex gap-2 flex-wrap">
                                  {(worker.skills || []).slice(0, 2).map((skill) => (
                                    <span className="badge text-bg-primary" key={`${worker.id}-${skill}`}>
                                      {skill}
                                    </span>
                                  ))}
                                  <span
                                    className={`badge ${
                                      worker.verification === "Verified" ? "text-bg-success" : "text-bg-warning"
                                    }`}
                                  >
                                    {worker.verification || "Not Yet Verified"}
                                  </span>
                                  <span className="badge text-bg-light border text-dark">
                                    {formatCurrency(worker.dailyRate)}/day
                                  </span>
                                  <span className="small text-muted align-self-center">{worker.rating}</span>
                                </div>
                              </div>
                              <div className="distance-pill">
                                <span className="distance-value">{worker.distanceKm || "0.00"} km</span>
                                <span className="distance-label">AWAY</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {view === "household-worker-profile" && selectedWorker && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    Dashboard
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    Post a Job
                  </button>
                  <button className="worker-nav-item active" onClick={openHouseholdMyJobs}>
                    My Jobs
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdProfile}>
                    My Profile
                  </button>
                  <button className="worker-nav-item active" onClick={openHouseholdNotifications}>
                    Notifications
                    {householdUnreadCount > 0 && <span className="nav-count-badge">{householdUnreadCount}</span>}
                  </button>
                </nav>
              </aside>

              <div className="worker-content">
                <div className="row g-3">
                  <div className="col-lg-4">
                    <div className="profile-card">
                      <div className="p-3 text-center">
                        <div className="profile-avatar mb-2">
                          {(selectedWorker.avatar || selectedWorker.firstName || "W").slice(0, 1).toUpperCase()}
                        </div>
                        <h2 className="h5 mb-1">
                          {getDisplayName(
                            selectedWorker.firstName,
                            selectedWorker.lastName,
                            selectedWorker.username
                          )}
                        </h2>
                        <p className="small text-muted mb-2">
                          {formatLocation(selectedWorker.barangay, selectedWorker.streetAddress)}
                        </p>
                        <span
                          className={`badge ${
                            selectedWorker.verification === "Verified" ? "text-bg-success" : "text-bg-warning"
                          }`}
                        >
                          {selectedWorker.verification || "Not Yet Verified"}
                        </span>
                      </div>
                      <div className="px-3 pb-3">
                        <p className="mb-1 small d-flex justify-content-between">
                          <span>Rating</span>
                          <strong>{selectedWorker.rating || "No ratings yet"}</strong>
                        </p>
                        <p className="mb-1 small d-flex justify-content-between">
                          <span>Jobs Done</span>
                          <strong>{selectedWorker.reviewsDone || 0}</strong>
                        </p>
                        <p className="mb-1 small d-flex justify-content-between">
                          <span>Experience</span>
                          <strong>{selectedWorker.yearsExperience || 0} yr(s)</strong>
                        </p>
                        <p className="mb-1 small d-flex justify-content-between">
                          <span>Status</span>
                          <strong>{selectedWorker.status || "Available"}</strong>
                        </p>
                        <p className="mb-1 small d-flex justify-content-between">
                          <span>Distance</span>
                          <strong>{selectedWorker.distanceKm || "0.00"} km</strong>
                        </p>
                        <p className="mb-1 small d-flex justify-content-between">
                          <span>Hourly Rate</span>
                          <strong>{formatCurrency(selectedWorker.hourlyRate)}</strong>
                        </p>
                        <p className="mb-3 small d-flex justify-content-between">
                          <span>Daily Rate</span>
                          <strong>{formatCurrency(selectedWorker.dailyRate)}</strong>
                        </p>
                        <button className="btn btn-primary w-100 mb-2" type="button" onClick={handleHireWorker}>
                          Hire This Worker
                        </button>
                        <button className="btn btn-outline-secondary w-100" type="button" onClick={openHouseholdMyJobs}>
                          Go Back
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-8">
                    <div className="profile-card mb-3">
                      <div className="profile-card-head">About</div>
                      <div className="p-3">
                        <p className="mb-0">{selectedWorker.bio || "No description provided yet."}</p>
                      </div>
                    </div>

                    <div className="profile-card mb-3">
                      <div className="profile-card-head">Skills & Expertise</div>
                      <div className="p-3 d-flex gap-2 flex-wrap">
                        {(selectedWorker.skills || []).map((skill) => (
                          <span className="badge text-bg-primary" key={`${selectedWorker.id}-${skill}`}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="profile-card">
                      <div className="profile-card-head">Reviews & Ratings</div>
                      <div className="p-3 d-grid gap-3">
                        {(selectedWorker.reviews || []).length > 0 ? (
                          selectedWorker.reviews.map((review) => (
                            <article key={review.id} className="review-item">
                              <div className="d-flex justify-content-between gap-3">
                                <div>
                                  <p className="mb-1 fw-semibold">{review.author}</p>
                                  <p className="mb-1 small text-muted">{review.comment}</p>
                                  <p className="mb-0 small text-muted">{review.date}</p>
                                </div>
                                <strong>{review.rating}/5</strong>
                              </div>
                            </article>
                          ))
                        ) : (
                          <p className="mb-0 text-muted">No reviews yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "household-notifications" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    Dashboard
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    Post a Job
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdMyJobs}>
                    My Jobs
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdProfile}>
                    My Profile
                  </button>
                  <button className="worker-nav-item active" onClick={openHouseholdNotifications}>
                    Notifications
                    {householdUnreadCount > 0 && <span className="nav-count-badge">{householdUnreadCount}</span>}
                  </button>
                </nav>
              </aside>

              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0 d-flex align-items-center gap-2">
                    Notifications
                    {householdUnreadCount > 0 && <span className="nav-count-badge">{householdUnreadCount}</span>}
                  </h1>
                  <div className="worker-user-meta d-flex align-items-center gap-2">
                    <span className="small fw-semibold">{currentUser?.displayName || "Household"}</span>
                    <span className="badge text-bg-primary">Household</span>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={goBack}>
                      Back
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                </div>

                <div className="applications-filter mt-3">
                  <div className="row g-2">
                    <div className="col-md-4">
                      <select className="form-select">
                        <option>All Notifications</option>
                        <option>Job Updates</option>
                        <option>Worker Matches</option>
                        <option>Job Status</option>
                      </select>
                    </div>
                    <div className="col-md-3 ms-md-auto">
                      <button
                        className="btn btn-outline-secondary w-100"
                        type="button"
                        onClick={() => markAllNotificationsRead(householdNotificationsWithReadState)}
                      >
                        Mark All as Read
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 d-grid gap-2">
                  {householdNotificationsWithReadState.length > 0 ? (
                    householdNotificationsWithReadState.map((item) => (
                      <article
                        className={`notification-card ${item.unread ? "unread" : ""}`}
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          markNotificationRead(item.id);
                          openHouseholdNotificationWorker(item);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            markNotificationRead(item.id);
                            openHouseholdNotificationWorker(item);
                          }
                        }}
                      >
                        <p className="small text-muted mb-1">{item.date}</p>
                        <h2 className="h6 mb-1">{item.title}</h2>
                        <p className="mb-0">{item.message}</p>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm mt-3"
                          onClick={() => openHouseholdNotificationWorker(item)}
                        >
                          View Details
                        </button>
                      </article>
                    ))
                  ) : (
                    <article className="notification-card">
                      <h2 className="h6 mb-1">No notifications yet</h2>
                      <p className="mb-0">Wala pang applications o updates para sa household account na ito.</p>
                    </article>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "household-dashboard" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item active" onClick={openHouseholdDashboard}>
                    Dashboard
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    Post a Job
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdMyJobs}>
                    My Jobs
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdProfile}>
                    My Profile
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdNotifications}>
                    Notifications
                    {householdUnreadCount > 0 && <span className="nav-count-badge">{householdUnreadCount}</span>}
                  </button>
                </nav>
              </aside>

              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0">Welcome, {currentUser?.displayName || "Household"}!</h1>
                  <div className="worker-user-meta d-flex align-items-center gap-2">
                    <span className="small fw-semibold">{currentUser?.displayName || "Household"}</span>
                    <span className="badge text-bg-primary">Household</span>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={goBack}>
                      Back
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-6 col-xl-4">
                    <div className="metric-card">
                      <p className="metric-label mb-1">Active Jobs</p>
                      <p className="metric-value mb-0">
                        {householdJobs.filter((job) => job.status === "Open").length}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6 col-xl-4">
                    <div className="metric-card">
                      <p className="metric-label mb-1">Cancelled Jobs</p>
                      <p className="metric-value mb-0">
                        {householdJobs.filter((job) => job.status === "Cancelled").length}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6 col-xl-4">
                    <div className="metric-card">
                      <p className="metric-label mb-1">Posted Jobs</p>
                      <p className="metric-value mb-0">{householdJobs.length}</p>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2 flex-wrap mt-3">
                  <button className="btn btn-primary btn-sm" onClick={openHouseholdPostJob}>
                    Post a New Job
                  </button>
                  <button className="btn btn-outline-primary btn-sm" onClick={openHouseholdMyJobs}>
                    View All My Jobs
                  </button>
                </div>

                <div className="card border-0 shadow-sm mt-4">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h2 className="h6 mb-0 fw-bold">Recent Job Posts</h2>
                    <button className="btn btn-outline-secondary btn-sm" onClick={openHouseholdMyJobs}>
                      View All
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Barangay</th>
                          <th>Rate</th>
                          <th>Status</th>
                          <th>Applications</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {householdJobs.length > 0 ? (
                          householdJobs.map((job) => (
                            <tr key={job.id}>
                              <td>{job.serviceType}</td>
                              <td>{job.barangay || "Not set"}</td>
                              <td>{formatRate(job.offeredRate, job.rateType)}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    job.status === "Cancelled" ? "text-bg-danger" : "text-bg-primary"
                                  }`}
                                >
                                  {job.status}
                                </span>
                              </td>
                              <td>{buildMatchedWorkersForJob(job, registeredWorkers).length}</td>
                              <td>
                                <button
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => openHouseholdJobDetail(job.id)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center text-muted py-4">
                              No posted jobs yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
