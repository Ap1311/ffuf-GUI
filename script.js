let stopFuzzing = false; // Flag to control fuzzing process
let startTime; // To calculate elapsed time

// Default Wordlists
const defaultWordlists = {
    sublist: "sublist.txt",
    phplist: "phplist.txt",
    supperlist: "supperlist.txt"
};

// Dynamically handle wordlist source selection
document.getElementById('wordlist-type').addEventListener('change', (e) => {
    const type = e.target.value;
    document.getElementById('manual-input').style.display = type === 'manual' ? 'block' : 'none';
    document.getElementById('file-input').style.display = type === 'file' ? 'block' : 'none';
    document.getElementById('default-options').style.display = type === 'default' ? 'block' : 'none';
});

// Start fuzzing button event listener
document.getElementById('fuzz-btn').addEventListener('click', async () => {
    const urlPattern = document.getElementById('url-pattern').value.trim();
    const wordlistType = document.getElementById('wordlist-type').value;
    const resultsDiv = document.getElementById('results');
    const finalResultsDiv = document.getElementById('final-results');
    const progressDiv = document.getElementById('progress');
    const errorMsgDiv = document.getElementById('error-msg');
    errorMsgDiv.innerHTML = ''; // Clear previous error message
    const wordlist = await getWordlist(wordlistType);

    if (!urlPattern.includes('$AP')) {
        alert('Please include "$AP" in the URL pattern for dynamic fuzzing.');
        return;
    }

    if (!wordlist || wordlist.length === 0) {
        alert('No valid wordlist provided.');
        return;
    }

    resultsDiv.innerHTML = '<h2>All Scanned Status Codes:</h2>'; // Clear previous results
    finalResultsDiv.innerHTML = '<h2>Final Results (200 & 403):</h2>'; // Clear final results

    progressDiv.innerHTML = `Progress: 0/${wordlist.length}`; // Reset progress display

    // Enable the stop button once fuzzing starts
    document.getElementById('stop-btn').disabled = false;
    startTime = Date.now(); // Start tracking time

    const proxy = "https://cors-anywhere.herokuapp.com/"; // Proxy to handle CORS issues

    // Loop through wordlist
    for (let i = 0; i < wordlist.length; i++) {
        if (stopFuzzing) {
            progressDiv.innerHTML = `Fuzzing stopped at ${i + 1}/${wordlist.length}`;
            break;
        }

        const payload = wordlist[i];
        const testUrl = proxy + urlPattern.replace('$AP', payload); // Use the payload as is

        try {
            const response = await fetch(testUrl, { method: 'GET' });

            // All Status Codes
            const resultDiv = document.createElement('div');
            resultDiv.className = 'result';
            resultDiv.innerHTML = `
                <strong>URL:</strong> ${testUrl.replace(proxy, '')}<br>
                <strong>Payload:</strong> ${payload}<br>
                <strong>Status:</strong> ${response.status} ${response.statusText}
            `;
            resultsDiv.appendChild(resultDiv);

            // Final Results for Status 200 & 403
            if (response.status === 200 || response.status === 403) {
                const finalResultDiv = document.createElement('div');
                finalResultDiv.className = response.status === 200 ? 'result success' : 'result forbidden';
                finalResultDiv.innerHTML = `
                    <strong>URL:</strong> ${testUrl.replace(proxy, '')}<br>
                    <strong>Payload:</strong> ${payload}<br>
                    <strong>Status:</strong> ${response.status} ${response.statusText}
                `;
                finalResultsDiv.appendChild(finalResultDiv);
            }
        } catch (error) {
            console.error('Fetch error:', error);  // Log the error in the console
            errorMsgDiv.innerHTML = `Error: ${error.message}. Please check your internet connection and try again.`;
            break;
        }

        // Calculate and display the estimated time remaining
        const elapsedTime = (Date.now() - startTime) / 1000; // Time in seconds
        const estimatedTimeRemaining = Math.round((elapsedTime / (i + 1)) * (wordlist.length - i - 1));
        progressDiv.innerHTML = `Progress: ${i + 1}/${wordlist.length} (Estimated time remaining: ${estimatedTimeRemaining} seconds)`;
    }

    // Disable stop button once fuzzing is complete
    document.getElementById('stop-btn').disabled = true;
});

// Stop fuzzing button event listener
document.getElementById('stop-btn').addEventListener('click', () => {
    stopFuzzing = true;
    document.getElementById('stop-btn').disabled = true;
    document.getElementById('progress').innerHTML = 'Fuzzing stopped.';
});

// Function to get the wordlist based on the selected method
async function getWordlist(type) {
    if (type === 'manual') {
        return document.getElementById('wordlist-textarea').value.split('\n').map(line => line.trim()).filter(line => line);
    } else if (type === 'file') {
        const fileInput = document.getElementById('wordlist');
        if (fileInput.files.length === 0) {
            alert('Please upload a wordlist file.');
            return [];
        }
        return await readWordlist(fileInput.files[0]);
    } else if (type === 'default') {
        const defaultList = document.getElementById('default-list').value;
        return await fetchWordlist(defaultWordlists[defaultList]);
    }
    return [];
}

// Function to fetch wordlist from file
async function fetchWordlist(filename) {
    try {
        const response = await fetch(filename);
        const text = await response.text();
        return text.split('\n').map(line => line.trim()).filter(line => line);
    } catch (error) {
        alert(`Error loading wordlist: ${error.message}`);
        return [];
    }
}

// Function to read wordlist from uploaded file
function readWordlist(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            const wordlist = event.target.result.split('\n').map(line => line.trim()).filter(line => line);
            resolve(wordlist);
        };
        reader.onerror = function () {
            reject('Error reading file.');
        };
        reader.readAsText(file);
    });
}
