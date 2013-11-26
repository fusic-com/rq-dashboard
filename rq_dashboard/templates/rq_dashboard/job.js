(function($) {
    window.refresh_all_tables = function(done) {
        var $raw_tpl = $('script[name=job-row]').html();
        var template = _.template($raw_tpl);

        var $tbody = $('table#jobs tbody');

        $('tr[data-role=loading-placeholder]', $tbody).show();

        // Fetch the available jobs on the queue
        api.getJob('{{ job_id }}', function(job) {
            $tbody.empty();
            var jobs = [job];

            if (job && jobs.length > 0) {
                $.each(jobs, function(i, job) {
                    job.expand=true;
                    job.created_at = toRelative(Date.create(job.created_at));

                    if (job.ended_at) {
                        job.ended_at = toRelative(Date.create(job.ended_at));
                    }
                    if (job.started_at) {
                        job.started_at = toRelative(Date.create(job.started_at));
                    }
                    job.duration = (Date.create(job.ended_at)-Date.create(job.started_at))/1000;
                    var html = template(job);
                    var $el = $(html);

                    $tbody.append($el);
                });
            } else {
                var html = $('script[name=no-jobs-row]').html();
                $tbody.append(html);
            }

            if (done !== undefined) {
                done();
            }
            window.asyncLoadLogs();
        });
    };

})($);
