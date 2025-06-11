const { parse } = require("yaml")
const fs = require("fs/promises");
const path = require("node:path");

const avatarDir = path.join(__dirname, "../../", "static", "img", "authors");

function fileExists(pathName) {
    return require("fs").existsSync(pathName)
}

async function ensureDir() {
    if (fileExists(avatarDir)) {
        return;
    }
    await fs.mkdir(avatarDir);
}

async function download(name, link) {
    const response = await fetch(link);
    const image = Buffer.from(await response.arrayBuffer());
    const localFile = path.join(avatarDir, `${name}.png`);
    if (fileExists(localFile)) {
        return;
    }
    await fs.writeFile(localFile, image);
}

async function exec() {
    await ensureDir();
    const fileDir = path.join(__dirname, "../../", "blog", "authors.yml");
    const fileContent = (await fs.readFile(fileDir)).toString();
    const authors = parse(fileContent);
    await Promise.all(Object.entries(authors).map(async ([name, author]) => {
        if (!author?.url) {
            return;
        }
        await download(name, `${author.url}.png`);
    }));
}

exec();