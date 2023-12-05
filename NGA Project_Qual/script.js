// Define variables
const randomImages = Array.from({ length: 6 }, (_, index) => document.getElementById(`randomImage${index}`));
const imageTitles = Array.from({ length: 6 }, (_, index) => document.getElementById(`imageTitle${index}`));
const displayDates = Array.from({ length: 6 }, (_, index) => document.getElementById(`displayDate${index}`));
const attributions = Array.from({ length: 6 }, (_, index) => document.getElementById(`attribution${index}`));
const generateButton = document.getElementById("generateButton");
const csvUrl = "merged_data.csv"; // Replace with your CSV file URL

const categories = ["birth", "infant", "youth", "adult", "elder", "death"];

const categoryToWords = {
    birth: [" birth ", " newborn "],
    infant: [" infant ", "toddler", "baby", "babe", "babies"],
    youth: ["child", " youth ", "kid", "children"],
    adult: ["adult", " man ", " woman ", "mother", "father", "men", "women"],
    elder: ["elderly", "senior", " old ", "elder", "grandfather", "grandmother", "old man", "old woman", "old men", "old women"],
    death: ["death", "end of life"]
};

function truncateText(text, wordLimit) {
    const words = text.split(' ');
    if (words.length > wordLimit) {
        return words.slice(0, wordLimit).join(' ') + '...';
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
    "Decorative Art"
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
    const regexPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');

    // Test if the title contains any of the specified keywords
    return regexPattern.test(title);
}

generateButton.addEventListener("click", () => {
    const selectedMedium = mediumFilter.value;

    for (let i = 0; i < 6; i++) {
        const category = categories[i]; // Assign a specific category

        const matchingImages = imageData.filter(imageObject => {
            const imageTitle = String(imageObject.title).toLowerCase();
            const categoryWords = categoryToWords[category];
            
            // Check if it matches the category and is not recently displayed
            const categoryMatch = filterImagesByCategory(imageTitle, category);
            const notDisplayed = !recentlyDisplayedImages[category]?.includes(imageObject.objectid);
            
            // Check if it matches the selected medium (classification)
            const mediumMatch = selectedMedium === "All Mediums" || imageObject.classification === selectedMedium;

            return categoryMatch && notDisplayed && mediumMatch;
        });

        if (matchingImages.length > 0) {
            const randomIndex = Math.floor(Math.random() * matchingImages.length);
            const randomImageObject = matchingImages[randomIndex];

            // Update the image
            randomImages[i].src = randomImageObject.iiifthumburl.trim();

            // Update the information including image title, display date, and attribution
            imageTitles[i].textContent = truncateText(randomImageObject.title, 12);
            displayDates[i].textContent = randomImageObject.displaydate;
            attributions[i].textContent = randomImageObject.attribution;

            // Add the displayed image's objectid to the recently displayed list
            recentlyDisplayedImages[category] = recentlyDisplayedImages[category] || [];
            recentlyDisplayedImages[category].push(randomImageObject.objectid);

            // If the recently displayed list becomes too large, remove the oldest entry
            if (recentlyDisplayedImages[category].length > 10) {
                recentlyDisplayedImages[category].shift();
            }
        } else {
            console.error(`No matching images found for the ${category} category.`);
        }
    }
});

// Fetch and parse the CSV file using PapaParse
Papa.parse(csvUrl, {
    header: true,
    download: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
        imageData = results.data;
    },
    error: function(error) {
        console.error("Error parsing the CSV file:", error);
    }
});
