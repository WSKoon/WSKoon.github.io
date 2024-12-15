import Papa from 'papaparse';
import Plotly from 'plotly.js-dist-min';

let filteredData: any[] = [];

// Function to filter and process the CSV data
function filterColumns(data: Array<{ [key: string]: string | number }>, eventFilter: string, equipmentFilter: string) {
    return data.map((row) => {
        return {
            Name: row['Name'] || 'N/A',
            Date: new Date(row['Date']),
            Squat: parseFloat(row['Best3SquatKg'] as string) || null,
            Bench: parseFloat(row['Best3BenchKg'] as string) || null,
            Deadlift: parseFloat(row['Best3DeadliftKg'] as string) || null,
            WeightClassKg: row['WeightClassKg'] || 'N/A',
            Total: parseFloat(row['TotalKg'] as string) || null,
            GL: parseFloat(row['Goodlift'] as string) || null,
            Bodyweight: parseFloat(row['BodyweightKg'] as string) || null,
            Squat1Kg: parseFloat(row['Squat1Kg'] as string) || null,
            Squat2Kg: parseFloat(row['Squat2Kg'] as string) || null,
            Squat3Kg: parseFloat(row['Squat3Kg'] as string) || null,
            Bench1Kg: parseFloat(row['Bench1Kg'] as string) || null,
            Bench2Kg: parseFloat(row['Bench2Kg'] as string) || null,
            Bench3Kg: parseFloat(row['Bench3Kg'] as string) || null,
            Deadlift1Kg: parseFloat(row['Deadlift1Kg'] as string) || null,
            Deadlift2Kg: parseFloat(row['Deadlift2Kg'] as string) || null,
            Deadlift3Kg: parseFloat(row['Deadlift3Kg'] as string) || null,
            Event: row['Event'],
            Equipment: row['Equipment']
        };
    }).filter((row) => {
        // Apply both Event and Equipment filters
        const eventMatches = eventFilter === 'all' || row.Event === eventFilter;
        const equipmentMatches = equipmentFilter === 'all' || row.Equipment === equipmentFilter;
        return eventMatches && equipmentMatches && row.Date instanceof Date && !isNaN(row.Date.getTime());
    });
}


// Function to update the plot based on the filtered data
function updatePlots(filteredData: any[]) {
    createLiftsOverTimePlot(filteredData);
    generateSummaryInfo(filteredData);
}

// Function to handle filter changes
function handleFilterChange() {
    const eventFilter = (document.querySelector('input[name="event"]:checked') as HTMLInputElement).value;
    const equipmentFilter = (document.querySelector('input[name="equipment"]:checked') as HTMLInputElement).value;

    // Filter the data based on selected filters
    const filtered = filterColumns(filteredData, eventFilter, equipmentFilter);
    
    // Update the plots with the filtered data
    updatePlots(filtered);
}

// Function to create the main plot (Squat, Bench, Deadlift, and Total over time)
function createLiftsOverTimePlot(data: any[]) {
    const eventFilter = (document.querySelector('input[name="event"]:checked') as HTMLInputElement)?.value;
    const equipmentFilter = (document.querySelector('input[name="equipment"]:checked') as HTMLInputElement)?.value;
    const dates = data.map((row) => row.Date);
    let traces: any[] = [];

    // Function to generate attempt hover text
    function getAttemptText(row: any, lift: string) {
        const attemptColumns = [`${lift}1Kg`, `${lift}2Kg`, `${lift}3Kg`];
        return attemptColumns.map((col, index) => {
            const attempt = row[col] && row[col] > 0 ? `${row[col]} kg` : 'Failed'; // Show weight or "Failed"
            return `${lift} Attempt ${index + 1}: ${attempt}`;
        }).join('<br>');
    }

    // Helper function to check if all attempts are failed (negative values or invalid)
    function hasValidAttempts(row: any, lift: string) {
        const attemptColumns = [`${lift}1Kg`, `${lift}2Kg`, `${lift}3Kg`];
        return attemptColumns.some(col => row[col] > 0 && row[col] !== null && !isNaN(row[col])); // At least one valid attempt
    }

    // Filter the data to remove lifts with all failed attempts
    const validSquatData = data.filter(row => hasValidAttempts(row, 'Squat'));
    const validDeadliftData = data.filter(row => hasValidAttempts(row, 'Deadlift'));
    const validBenchData = data.filter(row => hasValidAttempts(row, 'Bench'));

    // Plot based on event and equipment filter
    if (eventFilter === 'SBD' || eventFilter === 'all') {
        // For SBD or all event, plot Squat, Deadlift, and Bench
        const squatTrace = {
            x: validSquatData.map(row => row.Date),
            y: validSquatData.map(row => row.Squat),
            name: 'Squat',
            mode: 'lines+markers',
            type: 'scatter',
            line: { color: 'blue' },
            hovertext: validSquatData.map((row) => getAttemptText(row, 'Squat')),
            hoverinfo: 'text+x+y',
        };
        traces.push(squatTrace);

        const benchTrace = {
            x: validBenchData.map(row => row.Date),
            y: validBenchData.map(row => row.Bench),
            name: 'Bench',
            mode: 'lines+markers',
            type: 'scatter',
            line: { color: 'red' },
            hovertext: validBenchData.map((row) => getAttemptText(row, 'Bench')),
            hoverinfo: 'text+x+y',
        };
        traces.push(benchTrace);

        const deadliftTrace = {
            x: validDeadliftData.map(row => row.Date),
            y: validDeadliftData.map(row => row.Deadlift),
            name: 'Deadlift',
            mode: 'lines+markers',
            type: 'scatter',
            line: { color: 'green' },
            hovertext: validDeadliftData.map((row) => getAttemptText(row, 'Deadlift')),
            hoverinfo: 'text+x+y',
        };
        traces.push(deadliftTrace);
    } else if (eventFilter === 'B') {
        // Only for Bench event, plot Bench data
        const benchTrace = {
            x: validBenchData.map(row => row.Date),
            y: validBenchData.map(row => row.Bench),
            name: 'Bench',
            mode: 'lines+markers',
            type: 'scatter',
            line: { color: 'red' },
            hovertext: validBenchData.map((row) => getAttemptText(row, 'Bench')),
            hoverinfo: 'text+x+y',
        };
        traces.push(benchTrace);
    }

    // Always plot Total if available
    const totalTrace = {
        x: data.map((row) => row.Date),
        y: data.map((row) => row.Total),
        name: 'Total',
        mode: 'lines+markers',
        type: 'scatter',
        line: { color: 'black', dash: 'dash' },
        hovertext: data.map((row) => `Bodyweight: ${row.Bodyweight} kg<br>GL: ${row.GL}`),
        hoverinfo: 'text+x+y',
    };
    traces.push(totalTrace);

    const layout = {
        title: 'Comp progress',
        xaxis: { title: 'Date' },
        yaxis: { title: 'Lifts (Kg)' },
        hovermode: 'closest',
    };

    // Render the main plot
    Plotly.newPlot('plot-lifts', traces, layout);

    // Create individual graphs for Squat, Bench, and Deadlift attempts
    if (eventFilter === 'SBD' || eventFilter === 'all') {
        createAttemptsGraph(validSquatData, 'Squat', 'plot-squat');
        createAttemptsGraph(validBenchData, 'Bench', 'plot-bench');
        createAttemptsGraph(validDeadliftData, 'Deadlift', 'plot-deadlift');
    } else if (eventFilter === 'B') {
        createAttemptsGraph(validBenchData, 'Bench', 'plot-bench');
    }
}




// Function to create individual attempts graph for each lift (Squat, Bench, Deadlift)
function createAttemptsGraph(data: any[], lift: string, containerId: string) {
    const dates = data.map((row) => row.Date);
    const liftColors: { [key: string]: string } = {
        'Squat': 'blue',
        'Bench': 'red',
        'Deadlift': 'green',
    };

    const attemptColumns = [`${lift}1Kg`, `${lift}2Kg`, `${lift}3Kg`];
    const traces = data.map((row) => {
        const attempts = attemptColumns.map((col, index) => {
            return (row[col] && !isNaN(row[col]) && row[col] > 0) ? row[col] : null;
        }).filter(weight => weight !== null);

        const xValues = attempts.length > 0 ? [1, 2, 3].slice(0, attempts.length) : [];
        const formattedDate = row.Date.toISOString().split('T')[0];

        // Generate hover text: includes date, attempt number, and weight
        const hovertext = attemptColumns.map((col, index) => {
            const weight = row[col] && row[col] > 0 ? `${row[col]} kg` : 'Failed';
            return `Date: ${formattedDate}<br>Attempt ${index + 1}: ${weight}`;
        }).filter((_, index) => xValues.includes(index + 1)); // Ensure hover text matches valid x values

        return {
            x: xValues,
            y: attempts,
            name: formattedDate,
            mode: 'lines+markers',
            type: 'scatter',
            line: { color: liftColors[lift] },
            hovertext: hovertext,
            hoverinfo: 'text+x+y',
        };
    });

    const layout = {
        title: `${lift} Attempts`,
        xaxis: { title: 'Attempt Number', tickvals: [1, 2, 3], ticktext: ['Attempt 1', 'Attempt 2', 'Attempt 3'] },
        yaxis: { title: `${lift} Weight (Kg)` },
        hovermode: 'closest',
    };

    Plotly.newPlot(containerId, traces, layout);
    displayLiftStats(data, lift);
}

// Event listener for file upload
document.getElementById('uploadForm')!.addEventListener('submit', (event) => {
    event.preventDefault();
    const fileInput = <HTMLInputElement>document.getElementById('fileInput');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Please select a file.');
        return;
    }

    Papa.parse(fileInput.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
            filteredData = result.data;
            handleFilterChange();
        },
    });
});

function displayLiftStats(data: any[], lift: string) {
    const eventFilter = (document.querySelector('input[name="event"]:checked') as HTMLInputElement)?.value;

    // If the event is B, only show the Bench data (or corresponding lift)
    if (eventFilter === 'B' && lift !== 'Bench') {
        return;  // Skip if the event is B and the lift is not Bench
    }

    let jump1to2: number[] = [];
    let jump2to3: number[] = [];
    let jump1to3: number[] = [];
    let thirdAttemptSuccess: number = 0;
    let totalAttempts: number = 0;

    data.forEach((row) => {
        const attempt1 = row[`${lift}1Kg`];
        const attempt2 = row[`${lift}2Kg`];
        const attempt3 = row[`${lift}3Kg`];

        // Calculate jumps between attempts
        if (attempt1 && attempt2 && attempt1 > 0 && attempt2 > 0) {
            jump1to2.push(attempt2 - attempt1);
        }
        if (attempt2 && attempt3 && attempt2 > 0 && attempt3 > 0) {
            jump2to3.push(attempt3 - attempt2);
        }
        if (attempt1 && attempt3 && attempt1 > 0 && attempt3 > 0) {
            jump1to3.push(attempt3 - attempt1);
        }

        // Count successful third attempts
        if (attempt3 && attempt3 > 0) {
            thirdAttemptSuccess++;
        }
        if (attempt1 && attempt2 && attempt3) {
            totalAttempts++;
        }
    });

    // Calculate averages for each jump
    const avgJump1to2 = (jump1to2.length > 0) ? (jump1to2.reduce((a, b) => a + b, 0) / jump1to2.length).toFixed(2) : 0;
    const avgJump2to3 = (jump2to3.length > 0) ? (jump2to3.reduce((a, b) => a + b, 0) / jump2to3.length).toFixed(2) : 0;
    const avgJump1to3 = (jump1to3.length > 0) ? (jump1to3.reduce((a, b) => a + b, 0) / jump1to3.length).toFixed(2) : 0;
    const thirdAttemptSuccessRate = (totalAttempts > 0) ? ((thirdAttemptSuccess / totalAttempts) * 100).toFixed(2) : 0;

    // Update the stats container with the calculated stats
    const statsContainer = document.getElementById(`${lift.toLowerCase()}-stats`) as HTMLElement;
    const statsHtml = `
        <div><strong>${lift} Stats:</strong></div>
        <div>Average Jump (1st to 2nd Attempt): ${avgJump1to2} kg</div>
        <div>Average Jump (2nd to 3rd Attempt): ${avgJump2to3} kg</div>
        <div>Average Jump (1st to 3rd Attempt): ${avgJump1to3} kg</div>
        <div>Third Attempt Success Rate: ${thirdAttemptSuccessRate}%</div>
    `;
    statsContainer.innerHTML = statsHtml;
}

// Function to generate the summary info before the graph
function generateSummaryInfo(data: any[]) {
    // Get the most recent data (latest entry) for Weight Class and Name
    const mostRecentData = data.reduce((latest, row) => {
        return new Date(row.Date) > new Date(latest.Date) ? row : latest;
    });

    // Extract the necessary values
    const name = mostRecentData.Name || 'N/A';
    const weightClass = mostRecentData.WeightClassKg || 'N/A';
    const bestSquat = Math.max(...data.map((row) => row.Squat || 0));
    const bestBench = Math.max(...data.map((row) => row.Bench || 0));
    const bestDeadlift = Math.max(...data.map((row) => row.Deadlift || 0));
    const total = bestSquat + bestBench + bestDeadlift;

    // Populate the summary info section
    const summaryInfo = document.getElementById('summary-info') as HTMLElement;
    summaryInfo.innerHTML = `
        <div><strong>Name:</strong> ${name}</div>
        <div><strong>Weight Category:</strong> ${weightClass} kg</div>
        <div><strong>Best Squat:</strong> ${bestSquat} kg</div>
        <div><strong>Best Bench:</strong> ${bestBench} kg</div>
        <div><strong>Best Deadlift:</strong> ${bestDeadlift} kg</div>
        <div><strong>Total of Best Lifts:</strong> ${total} kg</div>
    `;
}