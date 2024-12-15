import Papa from 'papaparse';
import Plotly from 'plotly.js-dist-min';

// Function to filter and process the CSV data
function filterColumns(data: Array<{ [key: string]: string | number }>) {
    return data.map((row) => {
        return {
            Name: row['Name'] || 'N/A',
            Date: new Date(row['Date']), // Parse Date column
            Squat: parseFloat(row['Best3SquatKg'] as string) || null,
            Bench: parseFloat(row['Best3BenchKg'] as string) || null,
            Deadlift: parseFloat(row['Best3DeadliftKg'] as string) || null,
            //SquatPB: parseFloat(row['Best3SquatKg']) || 0,
            //BenchPB: parseFloat(row['Best3BenchKg']) || 0,
            //DeadliftPB: parseFloat(row['Best3DeadliftKg']) || 0,
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
        };
    }).filter((row) => row.Date instanceof Date && !isNaN(row.Date.getTime())); // Keep only valid rows
}

// Function to create the main plot (Squat, Bench, Deadlift, and Total over time)
function createLiftsOverTimePlot(data: any[]) {
    const dates = data.map((row) => row.Date);

    // Function to generate attempt hover text
    function getAttemptText(row: any, lift: string) {
        // Attempt columns for Squat, Bench, and Deadlift
        const attemptColumns = [
            `${lift}1Kg`, `${lift}2Kg`, `${lift}3Kg`
        ];

        return attemptColumns.map((col, index) => {
            const attempt = row[col] ? `${row[col]} kg` : 'Failed'; // Show weight or "Failed"
            return `${lift} Attempt ${index + 1}: ${attempt}`;
        }).join('<br>'); // Join attempts with line breaks for readability
    }

    // Main traces for Squat, Bench, Deadlift, and Total
    const squatTrace = {
        x: dates,
        y: data.map((row) => row.Squat),
        name: 'Squat',
        mode: 'lines+markers',
        type: 'scatter',
        line: { color: 'blue' },
        hovertext: data.map((row) => getAttemptText(row, 'Squat')), // Hover text for Squat attempts
        hoverinfo: 'text+x+y', // Show hovertext along with x and y values
    };

    const benchTrace = {
        x: dates,
        y: data.map((row) => row.Bench),
        name: 'Bench',
        mode: 'lines+markers',
        type: 'scatter',
        line: { color: 'red' },
        hovertext: data.map((row) => getAttemptText(row, 'Bench')), // Hover text for Squat attempts
        hoverinfo: 'text+x+y', // Show hovertext along with x and y values
    };

    const deadliftTrace = {
        x: dates,
        y: data.map((row) => row.Deadlift),
        name: 'Deadlift',
        mode: 'lines+markers',
        type: 'scatter',
        line: { color: 'green' },
        hovertext: data.map((row) => getAttemptText(row, 'Deadlift')), // Hover text for Squat attempts
        hoverinfo: 'text+x+y', // Show hovertext along with x and y values
    };

    const totalTrace = {
        x: dates,
        y: data.map((row) => row.Total),
        name: 'Total',
        mode: 'lines+markers',
        type: 'scatter',
        line: { color: 'black', dash: 'dash' },
        hovertext: data.map(
            (row) => `Bodyweight: ${row.Bodyweight} kg<br>GL: ${row.GL}`
        ),
        hoverinfo: 'text+x+y', // Show hovertext along with x and y values
    };

    // Combine the main traces
    const traces = [squatTrace, benchTrace, deadliftTrace, totalTrace];

    // Layout for the main plot
    const layout = {
        title: 'Comp progress',
        xaxis: { title: 'Date' },
        yaxis: { title: 'Lifts (Kg)' },
        hovermode: 'closest', // Highlight the closest data point

    };

    // Render the main plot
    Plotly.newPlot('plot-lifts', traces, layout);

    // Create individual graphs for Squat, Bench, and Deadlift attempts
    createAttemptsGraph(data, 'Squat', 'plot-squat');
    createAttemptsGraph(data, 'Bench', 'plot-bench');
    createAttemptsGraph(data, 'Deadlift', 'plot-deadlift');
}

// Function to create individual attempts graph for each lift (Squat, Bench, Deadlift)
function createAttemptsGraph(data: any[], lift: string, containerId: string) {
    const dates = data.map((row) => row.Date);

    // Define color mapping for each lift (consistent with the main graph)
    const liftColors: { [key: string]: string } = {
        'Squat': 'blue',
        'Bench': 'red',
        'Deadlift': 'green'
    };

    // Attempt columns for Squat, Bench, and Deadlift
    const attemptColumns = [`${lift}1Kg`, `${lift}2Kg`, `${lift}3Kg`];

    // Creating traces for each date
    const traces = data.map((row) => {
        // Plot data as [Attempt 1, Attempt 2, Attempt 3] (x-axis) vs weight (y-axis)
        const attempts = attemptColumns.map((col, index) => {
            // If the attempt is valid (not negative), use the weight; otherwise, plot as -1 (for failed attempts)
            return (row[col] && !isNaN(row[col]) && row[col] > 0) ? row[col] : null;  // Exclude negative/failed attempts
        }).filter(weight => weight !== null);  // Remove null values for plotting

        // Corresponding x values (Attempts 1, 2, 3), but only for successful attempts
        const xValues = attempts.length > 0 ? [1, 2, 3].slice(0, attempts.length) : [];  // Adjust x-axis according to valid attempts

        // Format the date as 'YYYY-MM-DD' for the legend
        const formattedDate = row.Date.toISOString().split('T')[0];  // Format the date to 'YYYY-MM-DD'

        // Hover text indicating "Failed" if the attempt is invalid
        const hovertext = attemptColumns.map((col, index) => {
            const attempt = (row[col] && !isNaN(row[col]) && row[col] > 0) ? `${row[col]} kg` : 'Failed';
            return `${lift} Attempt ${index + 1}: ${attempt}`;
        });

        return {
            x: xValues, // Only include valid attempts (Attempt 1, 2, or 3)
            y: attempts, // Only plot valid attempts
            name: formattedDate, // Simplified legend name (date in 'YYYY-MM-DD' format)
            mode: 'lines+markers',
            type: 'scatter',
            line: { color: liftColors[lift] }, // Use the color assigned to each lift
            hovertext: hovertext, // Show hover-over text with details
            hoverinfo: 'text+x+y',
        };
    });

    // Layout configuration for the graph
    const layout = {
        title: `${lift} Attempts`,
        xaxis: { title: 'Attempt Number', tickvals: [1, 2, 3], ticktext: ['Attempt 1', 'Attempt 2', 'Attempt 3'] },
        yaxis: { title: `${lift} Weight (Kg)` },
        hovermode: 'closest', // Hover interaction

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
            const rawData = result.data as any[];
            const filteredData = filterColumns(rawData);

            createLiftsOverTimePlot(filteredData);
            generateSummaryInfo(filteredData)
        },
    });
});

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

// Function to calculate and display statistics for each lift
function displayLiftStats(data: any[], lift: string) {
    const attemptColumns = [`${lift}1Kg`, `${lift}2Kg`, `${lift}3Kg`];

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
