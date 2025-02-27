import { getVersionChangeChain, getZipVersionPath } from "../store/repository/versions";

import AdmZip from "adm-zip"


function applyChangeChain(changeChain) {
    let fileSystem = {}; // In-memory file storage (filename -> content)

    for (const changeSet of changeChain) {
        for (const [file, change] of Object.entries(changeSet)) {
            if (change.type === "deleted") {
                delete fileSystem[file];
            } else if (change.type === "new") {
                fileSystem[file] = change.content;
            } else if (change.type === "modified") {
                if (fileSystem[file]) {
                    let fileLines = fileSystem[file].split("\n");

                    // Apply removals first (to avoid index shifts)
                    if (change.changes.remove) {
                        change.changes.remove.sort((a, b) => b - a); // Remove from end to start
                        change.changes.remove.forEach(lineNum => {
                            if (lineNum < fileLines.length) {
                                fileLines.splice(lineNum, 1);
                            }
                        });
                    }

                    // Apply additions
                    if (change.changes.add) {
                        change.changes.add.forEach(addition => {
                            const lineNum = parseInt(Object.keys(addition)[0]);
                            const content = Object.values(addition)[0];
                            fileLines.splice(lineNum, 0, content);
                        });
                    }

                    // Save back the modified content
                    fileSystem[file] = fileLines.join("\n");
                }
            }
        }
    }

    return fileSystem;
}


function createZipFromFileSystem(fileSystem, outputZipPath) {
    const zip = new AdmZip();

    for (const [file, content] of Object.entries(fileSystem)) {
        zip.addFile(file, Buffer.from(content, "utf8"));
    }

    zip.writeZip(outputZipPath);
}







export function generateVersionZip(repo_id, version_id){
    const finalFileSystem = applyChangeChain(getVersionChangeChain(repo_id, version_id));
    createZipFromFileSystem(finalFileSystem, getZipVersionPath(repo_id, version_id));
}