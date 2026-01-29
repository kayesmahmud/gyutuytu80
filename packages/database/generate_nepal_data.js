
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the flat locations list
const locations = JSON.parse(fs.readFileSync(path.join(__dirname, 'locations.json'), 'utf8'));

// Helper to find children
const findChildren = (parentId) => {
    return locations.filter(l => l.parent_id === parentId);
};

// Build hierarchy
const buildHierarchy = (parentId) => {
    const children = findChildren(parentId);
    if (!children.length) return [];

    return children.sort((a, b) => a.name.localeCompare(b.name)).map(child => {
        const grandChildren = buildHierarchy(child.id);
        const node = {
            name: child.name,
            type: child.type,
        };

        if (grandChildren.length > 0) {
            node.children = grandChildren;
        }
        return node;
    });
};

// Get provinces (roots)
const provinces = locations.filter(l => l.type === 'province' || l.parent_id === null).sort((a, b) => a.name.localeCompare(b.name));

const fullHierarchy = provinces.map(prov => {
    return {
        name: prov.name,
        type: 'province',
        children: buildHierarchy(prov.id)
    };
});

// Generate Dart Code
const dartCode = `class NepalLocationData {
  static const List<Map<String, dynamic>> locations = ${JSON.stringify(fullHierarchy, null, 2)};
}`;

console.log(dartCode);
