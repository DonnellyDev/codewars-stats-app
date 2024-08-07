document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profileForm");
  const resultsDiv = document.getElementById("results");
  const loadingDiv = document.getElementById("loading");
  const errorDiv = document.getElementById("error");
  const statsContainer = document.getElementById("statsContainer");
  const resultProfileName = document.getElementById("resultProfileName");

  const CODE_CHALLENGES_API_URL =
    "https://www.codewars.com/api/v1/code-challenges/";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const profileName = document.getElementById("profileName").value;

    resultsDiv.classList.add("hidden");
    loadingDiv.classList.remove("hidden");
    errorDiv.classList.add("hidden");

    try {
      const assignments = await getAllAssignmentsForUser(profileName);
      const allAssignments = await Promise.all(
        assignments.map((assignment) => getAllAssignmentData(assignment.slug))
      );

      let assignmentMap = allAssignments.reduce((acc, assignment) => {
        return {
          ...acc,
          [assignment.rank.name]: {
            count: (acc[assignment.rank.name]?.count ?? 0) + 1,
            names: [
              ...(acc[assignment.rank.name]?.names ?? []),
              assignment.name,
            ],
          },
        };
      }, {});

      displayResults(assignmentMap, profileName);
    } catch (error) {
      console.error("Error:", error);
      errorDiv.classList.remove("hidden");
      errorDiv.textContent =
        "An error occurred while fetching data. Please try again.";
    } finally {
      loadingDiv.classList.add("hidden");
    }
  });

  async function getAllAssignmentsForUser(
    profileName,
    page = 0,
    previousAssignments = []
  ) {
    const url = `https://www.codewars.com/api/v1/users/${profileName}/code-challenges/completed?page=${page}`;

    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      const allAssignments = [...previousAssignments, ...(data.data ?? [])];

      if (data.totalPages > page + 1) {
        return getAllAssignmentsForUser(profileName, page + 1, allAssignments);
      } else {
        return allAssignments;
      }
    } catch (error) {
      console.error("Error in getAllAssignmentsForUser:", error);
      throw error;
    }
  }

  async function getAllAssignmentData(assignmentSlug) {
    const url = `${CODE_CHALLENGES_API_URL}${assignmentSlug}`;

    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error in getAllAssignmentData:", error);
      throw error;
    }
  }

  function displayResults(assignmentMap, profileName) {
    resultsDiv.classList.remove("hidden");
    resultProfileName.textContent = profileName;

    statsContainer.innerHTML = "";

    const sortedAssignments = Object.entries(assignmentMap).sort((a, b) => {
      const rankA = parseInt(a[0].split(" ")[0]);
      const rankB = parseInt(b[0].split(" ")[0]);

      return rankB - rankA;
    });

    for (const [rank, stats] of sortedAssignments) {
      const card = document.createElement("div");
      card.classList.add("stat-card");
      card.innerHTML = `
                <h3>${rank}</h3>
                <p>Count: ${stats.count}</p>
                <h4>Challenges: </h4>
                <ul>
              ${stats.names.map((name) => `<li>${name}</li>`).join("")}
              </ul>
            `;
      statsContainer.appendChild(card);
    }
  }
});
