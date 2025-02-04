# Sistema de Seguiment de Preus de Vols i Allotjaments

Aquest projecte és una plataforma web que permet monitoritzar i fer seguiment automàtic de preus de vols i allotjaments en temps real. L’eina està construïda amb **React**, **Node.js** i **MongoDB**, i fa ús de l’API d’**Amadeus** per obtenir dades de vols.  
L’objectiu principal és ajudar els usuaris a trobar millors oportunitats de viatge segons els seus criteris (destinació, origen, dates i pressupost), així com mostrar l’impacte ambiental associat a cada ruta.

## Funcionalitats Principals
1. **Cerca de Vols i Allotjaments**: L’usuari pot establir paràmetres com origen, destinació, dates de viatge i rang de preus.  
2. **Monitorització Automàtica**: El sistema comprova periòdicament els preus i envia alertes per correu electrònic quan es detecten ofertes que compleixen els criteris definits.  
3. **Mapes Interactius**: Visualització de possibles destinacions segons el pressupost de l’usuari.  
4. **Anàlisi d’Impacte Ambiental**: Càlcul de les emissions de CO₂ per a cada vol i comparativa amb l’alternativa en tren.  
5. **Notificacions**: S’integren serveis com SendGrid per a l’enviament d’alertes via correu electrònic.

## Tecnologies i Eines
- **Front-End**: [React](https://react.dev/)
- **Back-End**: [Node.js](https://nodejs.org/)
- **Base de Dades**: [MongoDB](https://www.mongodb.com/)
- **API de Vols**: [Amadeus](https://developers.amadeus.com/) 
- **Enviament de Correu**: [SendGrid](https://sendgrid.com/) o altres serveis similars
