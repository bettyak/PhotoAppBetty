
var helpers = require('./helpers.js'),
    fs = require('fs');

exports.version = "0.1.0";

exports.generate = function (req, res) {
    var page = req.params.page_name;
    if (req.params.sub_page && req.params.page_name == 'admin')
        page = req.params.page_name + "_" + req.params.sub_page;

    fs.readFile('basic.html', (err, contents) => {
        if (err) {
            send_failure(res, helpers.http_code_for_error(err), err);
            return;
        }

        contents = contents.toString('utf8');

        //page name, dump output
        contents = contents.replace('{{PAGE_NAME}}', page);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(contents);
    });
};

//logged in and redirect
exports.login = function (req, res) {
    res.redirect("/pages/admin/home");
    res.end();
};
