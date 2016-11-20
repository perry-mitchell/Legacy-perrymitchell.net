const path = require("path");

const FRONTMATTER_SPLIT = /^---$/;
const FRONTMATTER_KEYVAL = /^[a-z0-9_]+\s*:\s*[^\s]+.*$/i;
const FRONTMATTER_OPEN = /^[a-z0-9_]+\s*:(\w+|)$/i;
const FRONTMATTER_LISTEL = /^\s*-\s\w+\s*$/;

function splitOnFirst(str, char) {
    let [first, ...rest] = str.split(char);
    return [first, rest.join(char)];
}

module.exports = {

    getSlugForMarkdownFile: function(filename) {
        return path.basename(filename).replace(/\.md$/i, "");
    },

    processPostFileContent: function(content) {
        let inFrontMatter = true,
            lines = content.split("\n"),
            properties = {},
            currentListProp = null,
            line;
        if (FRONTMATTER_SPLIT.test(lines[0].trim())) {
            // take off the first split (Jekyll support)
            lines.shift();
        }
        while (FRONTMATTER_SPLIT.test((line = lines.shift())) !== true) {
            if (currentListProp) {
                if (FRONTMATTER_LISTEL.test(line)) {
                    let value = line.replace(/^\s*-\s/, "").trim();
                    properties[currentListProp].push(value);
                } else {
                    currentListProp = null;
                }
            }
            if (FRONTMATTER_KEYVAL.test(line)) {
                let [ key, value ] = splitOnFirst(line, ":");
                properties[key] = value.trim();
            } else if (FRONTMATTER_OPEN.test(line)) {
                let [ key, ...rubbish ] = splitOnFirst(line, ":");
                properties[key] = [];
                currentListProp = key;
            }
        }
        return {
            frontMatter: properties,
            content: lines.join("\n")
        };
    }

};
