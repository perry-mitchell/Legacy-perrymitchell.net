const chalk = require("chalk");

const disk = require("./disk.js");
const content = require("./content.js");
const render = require("./render.js");
const sitemap = require("./sitemap.js");
const config = require("./config.js");

let date = new Date(),
    dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

console.log("\n");
console.log(chalk.bold("PerryMitchell.net"));
console.log("\n");

console.log(chalk.underline("Preparation"));
console.log(" → Remove build");
disk
    .cleanBuild()
    .then(function() {
        console.log(" → Prepare directories");
        return disk.prepareDirectories();
    })
    .then(function() {
        console.log(" → Render styles");
        return render.buildStyles();
    })
    .then(function() {
        console.log("\n");
        console.log(chalk.underline("Process posts"));
        console.log(" → Fetch posts");
        return disk.getAllPostFilenames();
    })
    .then(function(filenames) {
        console.log(` → ${chalk.yellow("Read posts")}`);
        return disk.getFilesContent(filenames);
    })
    .then(function(readFiles) {
        console.log(" → Process post content");
        return readFiles.map(function(fileData) {
            let processed = content.processPostFileContent(fileData.data),
                slug = content.getSlugForMarkdownFile(fileData.filename);
            sitemap.addLocation(`${config.baseURL}/article/${slug}/`, processed.frontMatter.date.split(" ").shift(), 0.6, "weekly");
            return Object.assign(
                fileData,
                {
                    data: processed.content,
                    frontMatter: processed.frontMatter
                }
            );
        });
    })
    .then(function(analysedFiles) {
        console.log(` → ${chalk.yellow("Copy post assets")}`);
        return Promise
            .all(analysedFiles.map(function(fileData) {
                return disk.copyAssets(fileData.filename);
            }))
            .then(() => analysedFiles);
    })
    .then(function(analysedFiles) {
        console.log(` → ${chalk.red("Copy assets")}`);
        return disk
            .copyExtras()
            .then(() => analysedFiles);
    })
    .then(function(analysedFiles) {
        console.log(` → ${chalk.red("Render posts")}`);
        return Promise
            .all(analysedFiles.map(function(fileData) {
                return render.renderPostMarkdown(fileData.filename, fileData.data, fileData.frontMatter);
            }))
            .then(() => analysedFiles);
    })
    .then(function(analysedFiles) {
        console.log("\n");
        console.log(chalk.underline("Process pages"));
        console.log(" → Render index");
        sitemap.addLocation(`${config.baseURL}/`, dateStr, 1.0, "daily");
        return render.renderIndex(analysedFiles);
    })
    .then(function() {
        console.log(` → ${chalk.yellow("Fetch pages")}`);
        return disk
            .getAllPageFilenames()
            .then(disk.getFilesContent);
    })
    .then(function(pages) {
        console.log(" → Process page content");
        return pages.map(function(fileData) {
            let processed = content.processPostFileContent(fileData.data),
                slug = content.getSlugForMarkdownFile(fileData.filename);
            sitemap.addLocation(`${config.baseURL}/${slug}/`, processed.frontMatter.date.split(" ").shift(), 0.4, "weekly");
            return Object.assign(
                fileData,
                {
                    data: processed.content,
                    frontMatter: processed.frontMatter
                }
            );
        });
    })
    .then(function(pages) {
        console.log(` → ${chalk.red("Render pages")}`);
        return Promise
            .all(pages.map(function(fileData) {
                return render.renderPageMarkdown(fileData.filename, fileData.data, fileData.frontMatter);
            }));
    })
    .then(function() {
        console.log("\n");
        console.log(chalk.underline("Cleanup"));
        console.log(" → Output sitemap");
        return disk.writeSitemap(sitemap.renderSitemap());
    })
    .then(function() {
        console.log("\n");
        console.log(chalk.dim.underline("Build complete"));
        console.log("\n");
    })
