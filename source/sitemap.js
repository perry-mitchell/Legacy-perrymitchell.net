const links = [];

function objectToXML(obj) {
    return Object.keys(obj).map(key => `<${key}>${obj[key]}</${key}>`).join("\n");
}

module.exports = {

    addLocation: function(url, lastmod, prio=0.5, changefreq="weekly") {
        links.push({
            loc: url,
            lastmod: lastmod,
            changefreq: changefreq,
            priority: prio
        });
    },

    renderSitemap: function() {
        return `<?xml version="1.0" encoding="UTF-8"?>
            <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${links.map(objectToXML).map(xml => `<url>\n${xml}\n</url>`).join("\n")}
            </urlset>
            `;
    }

};
