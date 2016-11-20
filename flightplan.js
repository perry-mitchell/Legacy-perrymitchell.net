const flightplan = require("flightplan");

flightplan.target("production", {
    host: "perrymitchell.net",
    username: "root",
    agent: process.env.SSH_AUTH_SOCK
});

flightplan.local(function(local) {
    local.log("Clean");
    local.exec("npm run clean");

    local.log("Build site");
    local.exec("npm run build");

    local.log("Compress build");
    local.exec("cd build; zip -r ../deploy.zip *");

    local.log("Transfer to remote");
    local.transfer(["deploy.zip"], "/tmp/");
});

flightplan.remote(function(remote) {
    remote.log("Unzipping");
    remote.exec("unzip /tmp/deploy.zip -d /usr/share/nginx/perrymitchell.net.prep/");

    remote.log("Switching");
    remote.exec("mv /usr/share/nginx/perrymitchell.net /usr/share/nginx/perrymitchell.net.old || true");
    remote.exec("mv /usr/share/nginx/perrymitchell.net.prep /usr/share/nginx/perrymitchell.net");

    remote.log("Cleanup");
    remote.exec("rm -rf /usr/share/nginx/perrymitchell.net.old || true");
    remote.exec("rm /tmp/deploy.zip");
});
