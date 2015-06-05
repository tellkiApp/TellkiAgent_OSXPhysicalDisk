/**
* This script was developed by Guberni and is part of Tellki's Monitoring Solution
*
* June, 2015
* 
* Version 1.0
*
* DESCRIPTION: Monitor OSX Physical Disks
*
* SYNTAX: node osx_physical_disk_monitor.js <METRIC_STATE>
* 
* EXAMPLE: node osx_physical_disk_monitor.js "1,1,1"
*
* README:
*       <METRIC_STATE> is generated internally by Tellki and it's only used by Tellki default monitors.
*       1 - metric is on ; 0 - metric is off
**/

// METRICS

var metrics = [];
metrics['AVRG_KB'] = { retrieveMetric: 1, id: '2134:Average KB/transaction:4' };
metrics['TRAN_PS'] = { retrieveMetric: 1, id: '2135:Transactions/s:4' };
metrics['IOMB_PS'] = { retrieveMetric: 1, id: '2136:IO MB/s:4' };

// ############# INPUT ###################################

//START
(function() {
    try
    {
        monitorInputProcess(process.argv.slice(2));
    }
    catch(err)
    {   
        console.log(err.message);
        process.exit(1);

    }
}).call(this)

/**
 * Process the passed arguments and send them to monitor execution
 * Receive: arguments to be processed
 */
function monitorInputProcess(args)
{
    if (args[0] != undefined)
    {
        //<METRIC_STATE>
        var metricState = args[0].replace(/\"/g, '');
        var tokens = metricState.split(',');

        if (tokens.length != Object.keys(metrics).length)
            throw new Error('Invalid number of metric state');

        var i = 0;
        for (var key in metrics) 
        {
            if (metrics.hasOwnProperty(key)) 
            {
                metrics[key].retrieveMetric = parseInt(tokens[i]);
                i++;
            }
        }
    }

    monitor();
}

// PROCESS

/**
 * Retrieve metrics information
 */
function monitor()
{
    var process = require('child_process');
     
    var ls = process.exec('iostat -d 5 2', function (error, stdout, stderr) {
        
        if (error)
            errorHandler(new UnableToGetMetricsError());

        parseResult(stdout.trim());
    });
        
    ls.on('exit', function (code) {
        if(code != 0)
            errorHandler(new UnableToGetMetricsError());
    });
}

/*
* Parse result from process output
* Receive: string containing results
*/
function parseResult(result)
{
    var outputMetrics = [];

    var lines = result.split('\n');
    var disks = lines[0].trim().replace(/\s+/g, ' ').split(' ');
    var data = lines[lines.length - 1].trim().replace(/\s+/g, ' ').split(' ');

    var i = 0;
    for (var d in disks)
    {

        var m = new Object();
        m.variableName = 'AVRG_KB';
        m.id = metrics['AVRG_KB'].id;
        m.value = data[i];
        m.object = d;
        i++;
        outputMetrics.push(m);

        m = new Object();
        m.variableName = 'TRAN_PS';
        m.id = metrics['TRAN_PS'].id;
        m.value = data[i];
        m.object = d;
        i++;
        outputMetrics.push(m);

        outputMetrics.push({
            variableName: 'IOMB_PS',
            id: metrics['IOMB_PS'].id,
            value: data[i],
            object: d
        });
        i++;
        
    }

    output(outputMetrics);
}



//################### OUTPUT METRICS ###########################

/*
* Send metrics to console
*/
function output(toOutput)
{
    for (var i in toOutput) 
    {
        var metricToOutput = toOutput[i];

        if (metrics.hasOwnProperty(metricToOutput.variableName)) 
        {
            if(metrics[metricToOutput.variableName].retrieveMetric === 1)
            {
                var output = '';
                
                output += metricToOutput.id + '|';
                output += metricToOutput.value + '|';
                output += metricToOutput.object;
                
                console.log(output);
            }
        }
    }
}

//################### ERROR HANDLER #########################
/*
* Used to handle errors of async functions
* Receive: Error/Exception
*/
function errorHandler(err)
{
    if(err instanceof UnableToGetMetricsError)
    {
        console.log(err.message);
        process.exit(err.code);
    }
    else
    {
        console.log(err.message);
        process.exit(1);
    }
}


//####################### EXCEPTIONS ################################

//All exceptions used in script

function UnableToGetMetricsError() {
    this.name = "UnableToGetMetricsError";
    this.message = ("Unable to get cpu metrics");
    this.code = 30;
}
UnableToGetMetricsError.prototype = Object.create(Error.prototype);
UnableToGetMetricsError.prototype.constructor = UnableToGetMetricsError;
