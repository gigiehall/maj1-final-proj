// Define variables
const randomImages = Array.from({ length: 6 }, (_, index) =>
  document.getElementById(`randomImage${index}`)
);
const randomImageContainers = Array.from({ length: 6 }, (_, index) =>
  document.querySelector(`#randomImage${index}.image-container`)
);
const imageTitles = Array.from({ length: 6 }, (_, index) =>
  document.getElementById(`imageTitle${index}`)
);
const displayDates = Array.from({ length: 6 }, (_, index) =>
  document.getElementById(`displayDate${index}`)
);
const attributions = Array.from({ length: 6 }, (_, index) =>
  document.getElementById(`attribution${index}`)
);
const generateButton = document.getElementById("generateButton");
const csvUrl = "merged_data.csv"; // Replace with your CSV file URL

const categories = ["birth", "infant", "youth", "adult", "elder", "death"];

const categoryToWords = {
  birth: [" birth ", " newborn "],
  infant: [" infant ", "toddler", "baby", "babe", "babies"],
  youth: ["child", " youth ", "kid", "children"],
  adult: ["adult", " man ", " woman ", "mother", "father", "men", "women"],
  elder: [
    "elderly",
    "senior",
    " old ",
    "elder",
    "grandfather",
    "grandmother",
    "old man",
    "old woman",
    "old men",
    "old women",
  ],
  death: ["death", "end of life"],
};

function truncateText(text, wordLimit) {
  const words = text.split(" ");
  if (words.length > wordLimit) {
    return words.slice(0, wordLimit).join(" ") + "...";
  }
  return text;
}

// Define an object to keep track of recently displayed images by category
const recentlyDisplayedImages = {};

// Create a select element for the medium filter
const mediumFilter = document.createElement("select");
mediumFilter.id = "mediumFilter";

// Define medium filter options
const mediumOptions = [
  "All Mediums",
  "Painting",
  "Sculpture",
  "Photograph",
  "Drawing",
  "Print",
  "Decorative Art",
  // Add more medium options as needed
];

// Create options and add them to the select element
mediumOptions.forEach((medium) => {
  const option = document.createElement("option");
  option.value = medium;
  option.text = medium;
  mediumFilter.appendChild(option);
});

// Append the medium filter to the filter container
const filterContainer = document.querySelector(".filter-container");
filterContainer.appendChild(mediumFilter);

// Modified function with regular expressions to handle partial matches
function filterImagesByCategory(title, category) {
  const keywords = categoryToWords[category];

  // Create a regular expression pattern with word boundaries
  const regexPattern = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");

  // Test if the title contains any of the specified keywords
  return regexPattern.test(title);
}

// Define an object to store the lock status for each category
const lockStatus = {};

// Function to create lock buttons and attach event listeners
function createLockButtons() {
  const lockButtons = document.querySelectorAll(".lock-toggle");

  lockButtons.forEach((button) => {
    const category = button.getAttribute("data-category");

    // Check if the lock status is defined for the category and update the button accordingly
    if (lockStatus[category]) {
      button.classList.add("locked");
    }

    button.addEventListener("click", function () {
      const category = this.getAttribute("data-category");
      toggleLock(category);
    });
  });
}

// Call the function to create lock buttons after creating them dynamically
createLockButtons();

function toggleLock(category) {
  // Toggle the lock status for the given category
  lockStatus[category] = !lockStatus[category];

  // Get the lock button for the category
  const lockButton = document.querySelector(
    `.lock-toggle[data-category="${category}"]`
  );

  // Toggle the "locked" class to visually represent the lock status
  lockButton.classList.toggle("locked", lockStatus[category]);

  console.log(`Toggling lock for ${category}. Locked: ${lockStatus[category]}`);
}

// Event listener for the generate button
generateButton.addEventListener("click", function () {
  generateTimeline();
  applyImageAnimation(); // Apply image animation after generating timeline
});

// Fetch and parse the CSV file using PapaParse
Papa.parse(csvUrl, {
  header: true,
  download: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  complete: function (results) {
    imageData = results.data;

    // Call generateTimeline and hideTextPermanently after images are loaded
    generateTimeline();
    applyImageAnimation(); // Apply image animation after generating timeline
  },
  error: function (error) {
    console.error("Error parsing the CSV file:", error);
  },
});

async function generateTimeline() {
  const selectedMedium = mediumFilter.value;

  // Create an array to store promises for image loading
  const imageLoadingPromises = [];

  for (let i = 0; i < 6; i++) {
    const category = categories[i]; // Assign a specific category

    // Skip the category if it's locked
    if (lockStatus[category]) {
      continue;
    }

    const matchingImages = imageData.filter((imageObject) => {
      const imageTitle = String(imageObject.title).toLowerCase();
      const categoryWords = categoryToWords[category];

      // Check if it matches the category and is not recently displayed
      const categoryMatch = filterImagesByCategory(imageTitle, category);
      const notDisplayed = !recentlyDisplayedImages[category]?.includes(
        imageObject.objectid
      );

      // Check if it matches the selected medium (classification)
      const mediumMatch =
        selectedMedium === "All Mediums" ||
        imageObject.classification === selectedMedium;

      return categoryMatch && notDisplayed && mediumMatch;
    });

    if (matchingImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * matchingImages.length);
      const randomImageObject = matchingImages[randomIndex];

      // Create a promise for each image loading
      const loadImagePromise = new Promise((resolve) => {
        const image = new Image();
        image.onload = function () {
          resolve({
            index: i,
            object: randomImageObject,
          });
        };
        image.src = randomImageObject.iiifthumburl.trim();
      });

      // Push the promise to the array
      imageLoadingPromises.push(loadImagePromise);
    } else {
      console.error(`No matching images found for the ${category} category.`);
    }
  }

  // Wait for all images to be loaded before updating the DOM and applying animation
  const loadedImages = await Promise.all(imageLoadingPromises);

  // Update the DOM and apply animation
  loadedImages.forEach(({ index, object }) => {
    randomImages[index].src = object.iiifthumburl.trim();
    imageTitles[index].textContent = truncateText(object.title, 12);
    displayDates[index].textContent = object.displaydate;
    attributions[index].textContent = object.attribution;

    // Add the displayed image's objectid to the recently displayed list
    recentlyDisplayedImages[object.category] =
      recentlyDisplayedImages[object.category] || [];
    recentlyDisplayedImages[object.category].push(object.objectid);

    // If the recently displayed list becomes too large, remove the oldest entry
    if (recentlyDisplayedImages[object.category].length > 10) {
      recentlyDisplayedImages[object.category].shift();
    }
  });

  // Apply image animation after all images are loaded and DOM is updated
  applyImageAnimation();
}

function applyImageAnimation() {
  randomImageContainers.forEach((container, index) => {
    const image = randomImages[index];

    image.onload = function () {
      // Apply animation after the image is loaded
      container.style.animationDelay = `${0.1 * (index + 1)}s`;
      container.classList.add("image-animation");
    };
  });
}

/////////// NAVIGATION ///////////

document.addEventListener("DOMContentLoaded", function () {
  // Get the current page URL
  const currentPageUrl = window.location.pathname;

  // Select all navigation links
  const navLinks = document.querySelectorAll(".navigation a");

  // Loop through each link and check if its href matches the current page URL
  navLinks.forEach(function (link) {
    const linkUrl = new URL(link.href).pathname;

    // If the link's href matches the current page URL, add an 'active' class
    if (linkUrl === currentPageUrl) {
      link.classList.add("active");
    }
  });
});
