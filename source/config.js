const environment = (process.env.ENVIRONMENT === "development") ? "development" : "production";

const configs = {

    production: {
        baseURL: "http://perrymitchell.net"
    },

    development: {
        baseURL: "http://localhost:4000"
    }

};

module.exports = configs[environment];
