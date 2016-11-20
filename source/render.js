const path = require("path");
const fs = require("fs");

const highlightJS = require("highlight.js");
const marked = require("marked");
const typeset = require("typeset");
const pug = require("pug");
const mkdir = require("mkdirp").sync;
const sass = require("node-sass");
const autoprefixer = require("autoprefixer");
const postcss = require("postcss");
const striptags = require("striptags");
const entities = require("html-entities").XmlEntities;

const config = require("./config.js");

const ROOT = path.resolve(__dirname, "../");
const BUILD_DIR = path.resolve(ROOT, "build");
const TEMPLATES_DIR = path.resolve(ROOT, "templates");
const STYLES_DIR = path.resolve(ROOT, "./resources/sass");

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Marked setup
let renderer = new marked.Renderer(),
    oldCodeRenderer = renderer.code.bind(renderer);
renderer.code = function(text, language) {
    let newCode = oldCodeRenderer(text, language),
        oldLen = newCode.length;
    //newCode = newCode.replace(`<code class="`, `<code class="hljs `);
    newCode = newCode.replace(/<code( class="(.+?)")?>/, '<code class="hljs $2">');
    return newCode;
}
marked.setOptions({
    renderer: renderer,
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    highlight: function(code) {
        return highlightJS.highlightAuto(code).value;
    }
});

function beautifyDateStr(dateStr) {
    let date = new Date(dateStr);
    return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function getDescription(html) {
    let text = striptags(html),
        words = text.split(/\s+/g);
    return entities.decode(words.slice(0, 50).join(" ")) + "...";
}

function sortPosts(years) {
    years.sort(function(yearA, yearB) {
        let yA = yearA.yearNo,
            yB = yearB.yearNo;
        if (yA > yB) {
            return -1;
        } else if (yB > yA) {
            return 1;
        }
        return 0;
    });
    years.forEach(function(yearItem) {
        yearItem.posts.sort(function(postA, postB) {
            let tA = (new Date(postA.date)).getTime(),
                tB = (new Date(postB.date)).getTime();
            if (tA > tB) {
                return -1;
            } else if (tB > tA) {
                return 1;
            }
            return 0;
        });
        yearItem.posts.forEach(function(post) {
            let date = new Date(post.date);
            post.dateStr = `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
        });
    });
}

let render = module.exports = {

    buildStyles: function() {
        let entry = path.resolve(STYLES_DIR, "./core.scss"),
            output = path.resolve(BUILD_DIR, "perrymitchell.css");
        return new Promise(function(resolve, reject) {
            sass.render({
                file: entry,
            }, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    let css = postcss([ autoprefixer ]).process(result.css).css;
                    fs.writeFile(output, css, "utf8", function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                }
            });
        });
    },

    renderIndex: function(allPosts) {
        let indexFilename = path.resolve(BUILD_DIR, "index.html"),
            templateFilename = path.join(TEMPLATES_DIR, "index.pug"),
            years = {};
        allPosts.forEach(function(postData) {
            let date = new Date(postData.frontMatter.date),
                year = date.getFullYear().toString(),
                slug = path.basename(postData.filename).replace(/\.md$/i, "");
            years[year] = years[year] || [];
            years[year].push(Object.assign({
                link: `${config.baseURL}/article/${slug}`
            }, postData.frontMatter));
        });
        years = Object.keys(years).map(year => ({yearNo: year, posts: years[year] }));
        sortPosts(years);
        let html = pug.renderFile(templateFilename, {
            page_title: "PerryMitchell.net",
            years: years,
            logo_link: `${config.baseURL}/about`,
            description: "Programming tips, tutorials, opinions and enthusiasm"
        });
        fs.writeFileSync(indexFilename, html, "utf8");
    },

    renderMarkdown: function(filename, markdown, properties, template, outputFilename) {
        return new Promise(function(resolve, reject) {
            let templateFilename = path.join(TEMPLATES_DIR, `${template}.pug`),
                content = marked(markdown);
            let html = pug.renderFile(templateFilename, {
                title: properties.title,
                page_title: `${properties.title} - PerryMitchell.net`,
                date: beautifyDateStr(properties.date),
                content: content,
                logo_link: config.baseURL,
                description: properties.description || getDescription(content)
            });
            fs.writeFile(outputFilename, html, "utf8", function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },

    renderPageMarkdown: function(filename, markdown, properties) {
        let directoryName = path.basename(filename).replace(/\.md$/i, ""),
            pageDir = path.join(BUILD_DIR, directoryName),
            index = path.resolve(pageDir, "index.html");
        mkdir(pageDir);
        return render.renderMarkdown(filename, markdown, properties, "page", index);
    },

    renderPostMarkdown: function(filename, markdown, properties) {
        let directoryName = path.basename(filename).replace(/\.md$/i, ""),
            articleDir = path.join(BUILD_DIR, "article", directoryName),
            index = path.resolve(articleDir, "index.html");
        mkdir(articleDir);
        return render.renderMarkdown(filename, markdown, properties, "post", index);
    }

};
