
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
            $.each(results.logs, function(jobid, lines){
                $("[data-job-id='" + jobid + "'] .job-logs.loading").removeClass("loading").html(lines);
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


    window.isTabVisible = true;

      // http://stackoverflow.com/questions/1060008/is-there-a-way-to-detect-if-a-browser-window-is-not-currently-active
      (function() {

        var onchange = function(evt) {

            var prevVisible = window.isTabVisible;
            var v = true, h = false,
                evtMap = {
                    focus:v, focusin:v, pageshow:v, blur:h, focusout:h, pagehide:h
                };

            evt = evt || window.event;
            if (evt.type in evtMap)
                window.isTabVisible = evtMap[evt.type];
            else
                window.isTabVisible = this[hidden] ? false : true;

            // if (prevVisible != self.isTabVisible) {
            //   self.trigger("visibilitychange");
            // }
        };

        var hidden = "hidden";

        // Standards:
        if (hidden in document)
            document.addEventListener("visibilitychange", onchange);
        else if ((hidden = "mozHidden") in document)
            document.addEventListener("mozvisibilitychange", onchange);
        else if ((hidden = "webkitHidden") in document)
            document.addEventListener("webkitvisibilitychange", onchange);
        else if ((hidden = "msHidden") in document)
            document.addEventListener("msvisibilitychange", onchange);
        // IE 9 and lower:
        else if ('onfocusin' in document)
            document.onfocusin = document.onfocusout = onchange;
        // All others:
        else
            window.onpageshow = window.onpagehide = window.onfocus = window.onblur = onchange;

      })();

    // $('#refresh-button').click(window.refresh_all_tables);
    window.refresh_all_tables();

    window.pollInterval = setInterval(function() {
        if ($("#enable-polling").is(":checked") && window.isTabVisible) {
            window.refresh_all_tables();
        }
    }, POLL_INTERVAL);

});