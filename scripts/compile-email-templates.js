const mjml = require('mjml');
const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '..', 'src', 'templates', 'email');
const outputDir = path.join(__dirname, '..', 'src', 'templates', 'email', 'compiled');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Fonction pour compiler un template MJML
function compileTemplate(templateName) {
  const mjmlPath = path.join(templatesDir, `${templateName}.mjml`);
  const htmlPath = path.join(outputDir, `${templateName}.html`);

  if (!fs.existsSync(mjmlPath)) {
    console.warn(`Template ${templateName}.mjml non trouvé`);
    return;
  }

  const mjmlContent = fs.readFileSync(mjmlPath, 'utf-8');
  
  const { html, errors } = mjml(mjmlContent, {
    validationLevel: 'soft',
    minify: false,
  });

  if (errors && errors.length > 0) {
    console.warn(`Avertissements pour ${templateName}:`, errors);
  }

  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`${templateName}.mjml compilé → ${templateName}.html`);
}

// Compiler tous les templates
const templateFiles = fs.readdirSync(templatesDir)
  .filter(file => file.endsWith('.mjml'))
  .map(file => file.replace('.mjml', ''));

if (templateFiles.length === 0) {
  console.log('Aucun template MJML trouvé');
} else {
  console.log(`Compilation de ${templateFiles.length} template(s)...\n`);
  templateFiles.forEach(compileTemplate);
  console.log('Compilation terminée !');
}

