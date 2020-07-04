window.onload = function () {
    if (chartData) {
        google.charts.load("current", {packages: ["corechart"]});
        google.charts.setOnLoadCallback(drawChart);

        function drawChart() {

            chartData.forEach(value => {

                // var data = google.visualization.arrayToDataTable([
                //     ["", "@coder/logger", 'child_process', 'extra', 'tar-fs', 'limiter', 'adm-uip'],
                //     ["", 12, 6, 8, 2, 1, 1]
                // ]);

                // var options = {
                //     title: "Import Distribution",
                //     // width: 600,
                //     // height: 100,
                //     bar: {groupWidth: "40%"},
                //     hAxis: {format: '0'},
                //     legend: { position: 'top', maxLines: 3 },
                //     isStacked: true,
                //     series: {
                //         0: {color: '#1e87f0'},
                //         1: {color: 'grey'},
                //         2: {color: 'grey'},
                //         3: {color: 'grey'},
                //         4: {color: 'grey'},
                //         5: {color: 'grey'}
                //     }
                // };
                var data = google.visualization.arrayToDataTable(value.data);
                var view = new google.visualization.DataView(data);
                var chart = new google.visualization.BarChart(document.getElementById(value.elementId));

                chart.draw(view, value.options);
            })
        }
    }
}