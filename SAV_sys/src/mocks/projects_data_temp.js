// Temporary file to generate projects and projectAttributeValues data
// This file contains the parsed data from the user's CSV

const rawData = `CS22-000002;SOPIQ;MERCEDES-BENZ;253;21/07/2022;MED ALI E.;Haute;SRV RAPIDE;En cours;Remplacement plaquettes de frein
CS22-000003;Maher Magdich;MERCEDES-BENZ;176;21/07/2022;MED ALI E.;Moyenne;MEC;En cours;
CS22-000006;KARIM BOUDABOUS;MERCEDES-BENZ;176;22/07/2022;MED ALI E.;Basse;CAR;En cours;Choc arrière 
CS22-000008;Abdeljabbar Ben Ali;MERCEDES-BENZ;177;09/09/2022;MED ALI E.;Haute;SRV RAPIDE;Terminé;Vidange`;

// Parse the data
const lines = rawData.trim().split('\n');
const projects = [];
const projectAttributeValues = [];

lines.forEach(line => {
    const parts = line.split(';');
    if (parts.length >= 10) {
        const [id, name, brandId, modelId, dateStr, creator, priority, type, status, description] = parts;

        // Create project entry
        projects.push({
            id: id.trim(),
            name: name.trim(),
            modelId: modelId.trim(),
            creationDate: convertDate(dateStr.trim()),
            userCreator: creator.trim()
        });

        // Create attribute values
        const projectId = id.trim();

        // Priority (attr1)
        if (priority && priority.trim()) {
            projectAttributeValues.push({
                id: `pav_${projectId}_attr1`,
                projectId: projectId,
                attributeId: 'attr1',
                value: priority.trim()
            });
        }

        // Status (attr2)
        if (status && status.trim()) {
            projectAttributeValues.push({
                id: `pav_${projectId}_attr2`,
                projectId: projectId,
                attributeId: 'attr2',
                value: status.trim()
            });
        }

        // Description (attr3)
        if (description && description.trim()) {
            projectAttributeValues.push({
                id: `pav_${projectId}_attr3`,
                projectId: projectId,
                attributeId: 'attr3',
                value: description.trim()
            });
        }

        // Date Entrée (attr4) - use creation date
        projectAttributeValues.push({
            id: `pav_${projectId}_attr4`,
            projectId: projectId,
            attributeId: 'attr4',
            value: convertDate(dateStr.trim())
        });

        // Type (attr9)
        if (type && type.trim()) {
            projectAttributeValues.push({
                id: `pav_${projectId}_attr9`,
                projectId: projectId,
                attributeId: 'attr9',
                value: type.trim()
            });
        }
    }
});

function convertDate(dateStr) {
    // Convert DD/MM/YYYY to ISO format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T08:00:00`;
    }
    return new Date().toISOString();
}

console.log('Projects:', JSON.stringify(projects, null, 2));
console.log('ProjectAttributeValues:', JSON.stringify(projectAttributeValues, null, 2));
