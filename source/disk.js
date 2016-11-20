const fs = require("fs");
const path = require("path");

const rimraf = require("rimraf");
const mkdir = require("mkdirp");
const dirExists = require("directory-exists").sync;
const copy = require("cpx").copy;

const ROOT = path.resolve(__dirname, "../");
const POSTS_DIR = path.resolve(ROOT, "./posts");
const PAGES_DIR = path.resolve(ROOT, "./pages");
const BUILD_DIR = path.resolve(ROOT, "./build");
const IMAGES_DIR = path.resolve(ROOT, "./resources/images");
const PUBLIC_DIR = path.resolve(ROOT, "./public");

function prepareDirectory(dir) {
    return new Promise(function(resolve) {
        // don't care about errors here
        mkdir(dir, resolve);
    });
}

function readFile(filename) {
    return new Promise(function(resolve, reject) {
        fs.readFile(filename, "utf8", function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

module.exports = {

    cleanBuild: function() {
        return new Promise(function(resolve) {
            // don't care about errors here
            rimraf(BUILD_DIR, resolve);
        });
    },

    copyAssets: function(filename) {
        let dirName = path.basename(filename).replace(/\.md$/i, ""),
            dirPath = path.join(POSTS_DIR, dirName);
        if (dirExists(dirPath)) {
            // copy assets
            let targetDir = path.resolve(BUILD_DIR, `./article/${dirName}`);
            new Promise(function(resolve, reject) {
                copy(`${dirPath}/*.*`, `${targetDir}/`, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }
        return Promise.resolve();
    },

    copyExtras: function() {
        return Promise.all([
            new Promise(function(resolve, reject) {
                copy(`${IMAGES_DIR}/*.png`, `${BUILD_DIR}/`, function(err) {
                    return (err) ? reject(err) : resolve();
                });
            }),
            new Promise(function(resolve, reject) {
                copy(`${PUBLIC_DIR}/**/*`, `${BUILD_DIR}/`, function(err) {
                    return (err) ? reject(err) : resolve();
                });
            })
        ]);
    },

    getAllPageFilenames: function() {
        return new Promise(function(resolve, reject) {
            fs.readdir(PAGES_DIR, function(err, files) {
                if (err) {
                    reject(err);
                } else {
                    resolve(
                        files
                            .filter(filename => /.md$/i.test(filename))
                            .map(filename => path.join(PAGES_DIR, filename))
                    );
                }
            });
        });
    },

    getAllPostFilenames: function() {
        return new Promise(function(resolve, reject) {
            fs.readdir(POSTS_DIR, function(err, files) {
                if (err) {
                    reject(err);
                } else {
                    resolve(
                        files
                            .filter(filename => /.md$/i.test(filename))
                            .map(filename => path.join(POSTS_DIR, filename))
                    );
                }
            });
        });
    },

    getFilesContent: function(fileList) {
        return Promise.all(
            fileList
                .map(function(filename) {
                    return readFile(filename).then(function(data) {
                        return {
                            filename,
                            data
                        };
                    });
                })
        );
    },

    prepareDirectories: function() {
        return Promise.all([
            prepareDirectory(path.join(BUILD_DIR, "article"))
        ]);
    },

    writeSitemap: function(sitemapXML) {
        return new Promise(function(resolve, reject) {
            fs.writeFile(path.resolve(BUILD_DIR, "./sitemap.xml"), sitemapXML, "utf8", function(err) {
                return (err) ? reject(err) : resolve();
            });
        });
    }

};
