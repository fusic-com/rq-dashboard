
var url_for = function(name, param) {
    var url = BASE_URL;
    if (name == 'queues') { url += 'queues.json'; }
    else if (name == 'workers') { url += 'workers.json'; }
    else if (name == 'cancel_job') { url += 'job/' + encodeURIComponent(param) + '/cancel'; }
    else if (name == 'requeue_job') { url += 'job/' + encodeURIComponent(param) + '/requeue'; }
    else if (name == 'jobs_names') { url += 'jobs-names/' + encodeURIComponent(param) + '.json'; }
    return url;
};

var url_for_jobs = function(param, page) {
    var url = BASE_URL + 'jobs/' + encodeURIComponent(param) + '/' + page + '.json';
    return url;
};

var toRelative = function(universal_date_string) {
    var tzo = new Date().getTimezoneOffset();
    var d = Date.create(universal_date_string).rewind({ minutes: tzo });
    return d.relative();
};

var api = {
    getQueues: function(cb) {
        $.getJSON(url_for('queues'), function(data) {
            var queues = data.queues;
            cb(queues);
        });
    },

    getJobs: function(queue_name, page, cb) {
        $.getJSON(url_for_jobs(queue_name, page), function(data) {
            var jobs = data.jobs;
            var pagination = data.pagination;
            cb(jobs, pagination);
        });
    },

    getJobsNames: function(queue_name, cb) {
        $.getJSON(url_for("jobs_names", queue_name), function(data) {
            var jobsNames = data.jobs_names || [];
            cb(jobsNames);
        });
    },

    getWorkers: function(cb) {
        $.getJSON(url_for('workers'), function(data) {
            var workers = data.workers;
            cb(workers);
        });
    },

    getJob: function(job_id, cb) {
        $.getJSON(BASE_URL+"job/"+job_id+"/data.json", function(data) {
            cb(data);
        });
    }
};

window.asyncLoadLogs = function(){
    jobsIds = [];
    $(".job-logs.loading").each(function(){
        jobsIds.push($(this).closest("[data-role=job]").data("job-id"));
    });
    $.ajax({
        "url": "/logs.json",
        "type": "POST",
        "contentType": 'application/json',
        "dataType": "json",
        "data": JSON.stringify({"jobsids": jobsIds}),
        "success":function(results) {
            if (!results.success) return console.log("error on fetching job logs : " + results.error);
            $.each(results.logs, function(i, item){
                $("[data-job-id='" + item.jobid + "'] .job-logs.loading").removeClass("loading").html(item.logs.join("\n"));
            });
            $(".job-logs.loading").removeClass("loading").html("&oslash;");
        }
    });
};


$(document).ready(function(){
  // Enable the AJAX behaviour of the cancel job button
    $('[data-role=cancel-job-btn]').live('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $this = $(this),
            $row = $this.closest('tr'),
            job_id = $row.data('job-id'),
            url = url_for('cancel_job', job_id);

        $.post(url, function(data) {
            $row.fadeOut('fast', function() { $row.remove(); });
        });

        return false;
    });

    // Enable the AJAX behaviour of the requeue button
    $('[data-role=requeue-job-btn]').live('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $this = $(this),
            $row = $this.closest('tr'),
            job_id = $row.data('job-id'),
            url = url_for('requeue_job', job_id);

        $.post(url, function(data) {
            $row.fadeOut('fast', function() { $row.remove(); });
        });

        return false;
    });


    $("#enable-polling").change(function(firstLoad){
        if ($(this).is(":checked")) {
            window.pollInterval = setInterval(window.refresh_all_tables, POLL_INTERVAL);
            if (!firstLoad) window.refresh_all_tables();
        } else if (window.pollInterval !== undefined) {
            clearInterval(window.pollInterval);
            delete(window.pollInterval);
        }
    });
    $("#enable-polling").change(true);
    // $('#refresh-button').click(window.refresh_all_tables);
    window.refresh_all_tables();
});