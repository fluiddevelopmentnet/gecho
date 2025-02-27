import AdmZip from "adm-zip"
import { diffLines } from "diff"
import { getZipVersionPath } from "../store/repository/versions";

function extractZipContents(zipPath) {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    const files = {};

    zipEntries.forEach(entry => {
        if (!entry.isDirectory) {
            files[entry.entryName] = zip.readAsText(entry);
        }
    });

    return files;
}

export function getDiff(new_version_id, old_version_id) {
    let files1;

    if(old_version_id){
        files1 = extractZipContents(getZipVersionPath(old_version_id));
    }else{
        files1 = new AdmZip(new Buffer("")) // an empty zip
    }

    const files2 = extractZipContents(new_version_id);
    const allFiles = new Set([...Object.keys(files1), ...Object.keys(files2)]);
    const result = {};

    allFiles.forEach(file => {
        if (!(file in files1)) {
            result[file] = { type: "new", content: files2[file] }; // New file with content
        } else if (!(file in files2)) {
            result[file] = { type: "deleted" }; // Deleted file
        } else if (files1[file] !== files2[file]) {
            // File is modified, compute line diffs
            const diff = diffLines(files1[file], files2[file]);
            const changes = { add: [], remove: [] };

            let lineNumber = 0;
            diff.forEach(part => {
                if (part.added) {
                    part.value.split("\n").forEach((line, index) => {
                        if (line.trim() !== "") {
                            changes.add.push({ [lineNumber + index]: line });
                        }
                    });
                } else if (part.removed) {
                    part.value.split("\n").forEach((_, index) => {
                        changes.remove.push(lineNumber + index);
                    });
                }
                if (!part.removed) {
                    lineNumber += part.count;
                }
            });

            result[file] = { type: "modified", changes };
        }
    });

    return result;
}