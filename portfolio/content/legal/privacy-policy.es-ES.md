# Política de Privacidad

**Última actualización:** {{EFFECTIVE_DATE}}
**Versión:** 1.0

Esta Política de Privacidad describe cómo se recogen, utilizan, comparten, almacenan y protegen los datos personales de las personas que visitan y utilizan **{{DOMAIN}}** (el "Sitio").

El Sitio es un portafolio personal y un blog técnico. No es un servicio comercial de gran escala, pero sí trata datos personales reales. Por ello se rige por la **Ley n.º 13.709/2018 de Brasil (Ley General de Protección de Datos Personales — LGPD)** y, cuando resulte aplicable a visitantes del Espacio Económico Europeo, por el **Reglamento (UE) 2016/679 (RGPD)**.

Lee este documento con atención. Al crear una cuenta, comentar, suscribirte al boletín o apoyar el Sitio, confirmas que comprendes las prácticas aquí descritas.

## 1. Quién es el responsable del tratamiento

| | |
|---|---|
| **Responsable** | {{OWNER}} |
| **Dirección** | {{ADDRESS}} |
| **Contacto de privacidad** | {{PRIVACY_EMAIL}} |
| **País de operación** | Brasil |

El Sitio lo mantiene una persona física. No se ha designado formalmente un Delegado de Protección de Datos, lo que está permitido para agentes de tratamiento de pequeño porte según la normativa aplicable de la ANPD. El canal de contacto indicado cumple la función prevista en el art. 41, § 2 de la LGPD.

## 2. Principio rector: recoger lo mínimo

El Sitio está diseñado para **recoger únicamente lo necesario**. En concreto:

- **Ningún dato personal se vende, alquila ni cede** a terceros con fines comerciales.
- **Ningún dato se utiliza para publicidad personalizada**, retargeting ni elaboración de perfiles publicitarios.
- **No se venden datos a intermediarios de datos** (*data brokers*).
- **No se recogen datos sensibles** (art. 5, II de la LGPD): origen racial o étnico, convicción religiosa, opinión política, afiliación sindical, datos de salud, vida sexual, genéticos o biométricos. Te pedimos que **no incluyas** ese tipo de información en comentarios, mensajes ni en tu perfil.
- **No se toman decisiones automatizadas con efectos jurídicos** sobre ti, salvo el filtrado automático del contenido enviado por las personas usuarias (sección 5.1), que siempre puede someterse a revisión humana.

## 3. Qué datos se recogen

Lo que sigue refleja exactamente lo que la aplicación almacena. No todo te aplica: la mayor parte solo existe si eliges usar la funcionalidad correspondiente.

### 3.1 Datos de cuenta (si creas una cuenta)

El núcleo de tu cuenta lo componen **nombre de usuario, correo electrónico y avatar**. Además, según el método de autenticación elegido:

| Dato | Origen | Observación |
|---|---|---|
| Dirección de correo | Tú o el proveedor OAuth | Identificador único de la cuenta |
| Nombre de usuario | Generado a partir del correo/nombre, o elegido por ti | Público |
| Avatar (URL de la imagen) | Proveedor OAuth (Google/GitHub) | Público. La imagen sigue alojada por el proveedor |
| Contraseña | Tú, solo en el registro con correo y contraseña | Se almacena exclusivamente como *hash* criptográfico (bcrypt). **La contraseña en texto legible nunca se almacena ni la conoce el responsable** |
| Identificador del proveedor OAuth | Google o GitHub | Código técnico que vincula tu cuenta al proveedor. No da acceso a tu cuenta en dicho proveedor |
| Estado de verificación del correo | Sistema | — |
| Fechas de creación y actualización | Sistema | — |

Cuando inicias sesión con Google o GitHub, el Sitio recibe de esos proveedores únicamente **correo electrónico, nombre, foto de perfil y un identificador**. El Sitio **no** recibe tu contraseña, tus contactos, tus repositorios privados ni ningún otro contenido de tu cuenta.

### 3.2 Datos de perfil público (opcionales, aportados por ti)

Si los completas, el Sitio almacena y **muestra públicamente**: una breve descripción personal ("sobre mí"), el enlace a tu perfil de GitHub y el enlace a tu perfil de LinkedIn. Son campos totalmente opcionales y puedes vaciarlos en cualquier momento en la configuración del perfil.

### 3.3 Contenido que publicas

Se almacena y **se muestra públicamente**, asociado a tu nombre de usuario y avatar:

- comentarios en artículos (y respuestas a comentarios);
- votos en comentarios;
- "me gusta" en artículos;
- mensajes publicados en el Guestbook/Wall.

Ten presente que todo lo publicado en esas áreas es **público, indexable por buscadores y potencialmente copiable por terceros**. No publiques información que no quieras hacer pública.

### 3.4 Boletín (solo con consentimiento)

El boletín funciona con **doble confirmación de suscripción (*double opt-in*)**: tras suscribirte recibes un correo, y la suscripción solo se activa si haces clic en el enlace de confirmación.

Se almacenan: dirección de correo, idioma preferido, estado de la suscripción, fechas de suscripción/confirmación/baja y tokens aleatorios usados para confirmar y para darse de baja.

**Métricas de envío.** Los correos del boletín incluyen un píxel de seguimiento que registra **si el mensaje se abrió y cuántas veces**, además del estado de entrega. Esta métrica sirve únicamente para valorar la calidad del contenido y la salud del envío. Si prefieres no ser contabilizado, basta con bloquear la carga de imágenes en tu cliente de correo: el contenido seguirá siendo legible.

Todos los correos del boletín incluyen un enlace de baja de un solo clic, válido de forma permanente.

### 3.5 Apoyo económico (página `/support`)

Consulta también la **sección 9**, que detalla el funcionamiento de las donaciones.

Por cada donación, el Sitio almacena: nombre a mostrar (opcional), mensaje público (opcional), número de "cafés", importe, moneda, medio de pago, estado del cobro, indicador de donación privada y el **identificador de la transacción generado por la pasarela de pago**.

El Sitio **no almacena** números de tarjeta, CVV, fecha de caducidad, datos bancarios ni credenciales financieras. Esos datos se introducen y se procesan directamente en el entorno de la pasarela de pago y nunca pasan por la base de datos del Sitio.

En el flujo de PIX, los datos exigidos por la normativa del medio de pago (nombre, correo, teléfono e identificación fiscal brasileña) se **transmiten directamente a la pasarela** para emitir el cobro y **no se conservan** en la base de datos del Sitio.

En las donaciones con criptomonedas se registran: dirección de la cartera de origen, *hash* de la transacción, red, activo, importe, número de bloque y el mensaje opcional. Estos datos **ya son públicos por naturaleza**, al constar en la blockchain (véase la sección 9.3).

### 3.6 Formulario de contacto

El formulario de contacto recoge **nombre, correo electrónico, asunto y el texto del mensaje**. Desde la última actualización de esta política, los mensajes **se guardan en la base de datos del Sitio** y ya no pasan por un servicio externo de reenvío de formularios.

Junto al mensaje se registran, únicamente para prevenir abusos: el **idioma** de la página, el **agente de usuario** del navegador y un **identificador derivado de la dirección IP**. Ese identificador es el resultado de una función de resumen criptográfico (SHA-256) aplicada a la IP junto con un secreto del servidor — **la dirección IP en sí no se almacena** y el identificador no permite reconstruirla. Sirve solo para reconocer que varios mensajes provienen del mismo origen.

El envío está protegido por **Cloudflare Turnstile**, un mecanismo de verificación antiautomatización que sustituye al CAPTCHA tradicional (véase la sección 5.1).

### 3.7 Datos técnicos y de seguridad

| Dato | Finalidad | Dónde se almacena |
|---|---|---|
| Dirección IP | Limitación de peticiones (*rate limiting*) y prevención de abuso, spam y ataques automatizados | Caché temporal (Redis), con expiración automática a corto plazo |
| Registros de error y rendimiento | Diagnóstico de fallos y estabilidad | Servicio de monitorización de errores |
| Registros de acceso a la aplicación | Cumplimiento del art. 15 de la Ley n.º 12.965/2014 (Marco Civil de Internet, Brasil) | Servidor/infraestructura |
| Cookies e identificadores | Véase la sección 7 | Tu navegador |
| Métricas agregadas de audiencia | Estadísticas de lectura | Google Analytics 4, solo con consentimiento |
| Recuento de visualizaciones de artículos | Estadística editorial | Cookie técnica de corta duración + contador agregado. No identifica al lector |

## 4. Por qué se recogen los datos y cuál es la base legal

La LGPD exige una base legal para todo tratamiento. La tabla siguiente indica la base adoptada para cada finalidad.

| Finalidad | Datos implicados | Base legal (LGPD) |
|---|---|---|
| Crear y mantener tu cuenta; autenticar el acceso | Datos de cuenta (3.1) | Art. 7, V — ejecución de contrato o de trámites preliminares |
| Mostrar tu perfil público, comentarios, votos y mensajes | 3.2 y 3.3 | Art. 7, V — ejecución de contrato |
| Recuperación de contraseña | Correo y token temporal | Art. 7, V |
| Enviar el boletín | Correo y preferencias (3.4) | Art. 7, I — **consentimiento**, revocable en cualquier momento |
| Medir apertura y entrega del boletín | Métricas de campaña (3.4) | Art. 7, IX — interés legítimo en la calidad y la entregabilidad del envío |
| Procesar y registrar aportaciones económicas | 3.5 | Art. 7, V — ejecución de contrato; y art. 7, II — cumplimiento de obligación legal y regulatoria |
| Responder mensajes de contacto | 3.6 | Art. 7, V y IX |
| Moderar contenido y prevenir spam, estafas, *phishing* y abuso | Texto de comentarios, URLs, IP, datos de cuenta | Art. 7, IX — interés legítimo en la seguridad de los usuarios y la integridad del servicio |
| Aplicar suspensiones y expulsiones y conservar su registro | Cuenta y motivo del bloqueo | Art. 7, IX y VI — interés legítimo y ejercicio regular de derechos |
| Mantener la seguridad, disponibilidad y diagnóstico del Sitio | Datos técnicos (3.7) | Art. 7, IX |
| Conservar registros de acceso a la aplicación | Registros de conexión | Art. 7, II — cumplimiento de obligación legal (Marco Civil de Internet, art. 15) |
| Elaborar estadísticas de audiencia con cookies analíticas | Véase la sección 7 | Art. 7, I — **consentimiento** |
| Defenderse en procesos judiciales, administrativos o arbitrales | Según sea necesario | Art. 7, VI |

Cuando la base es el interés legítimo, el tratamiento se limita a lo estrictamente necesario para la finalidad declarada, y puedes oponerte a él por el canal indicado en la sección 12.

## 5. Con quién se comparten los datos

El Sitio **no vende datos**. Solo se comparten con **encargados del tratamiento** que realizan funciones imprescindibles para el servicio, siempre limitado al mínimo necesario.

### 5.1 Categorías de encargados

| Categoría | Para qué sirve | Datos transmitidos |
|---|---|---|
| Proveedores de autenticación (Google, GitHub) | Inicio de sesión social | Confirmación de identidad; recibimos correo, nombre, avatar e identificador |
| Pasarela de pago con tarjeta | Cobro y prevención de fraude | Datos de la tarjeta (introducidos directamente en el entorno de la pasarela), importe y metadatos de la donación |
| Pasarela de pago PIX | Emisión y liquidación del cobro | Nombre, correo, teléfono e identificación fiscal del pagador, cuando se aportan; importe |
| Proveedor de infraestructura y alojamiento | Ejecutar la aplicación y la base de datos | Todos los datos almacenados, bajo contrato y deber de confidencialidad |
| Servicio de envío de correos transaccionales y del boletín | Entregar confirmaciones, recuperación de contraseña y campañas | Correo del destinatario y contenido del mensaje |
| Servicio de verificación antiautomatización (*CAPTCHA*) | Distinguir personas de robots en el formulario de contacto | Señales técnicas del navegador y dirección IP, enviadas directamente por tu navegador al proveedor |
| Servicio de mensajería instantánea | Avisar al responsable de que llegó un mensaje nuevo | Nombre, asunto y un fragmento inicial del mensaje |
| Servicio de moderación automatizada de contenido | Detectar contenido abusivo antes de publicarlo | Texto del comentario o mensaje |
| Servicio de verificación de seguridad de URLs | Bloquear enlaces de *phishing* y malware | URLs contenidas en el contenido enviado |
| Servicio de monitorización de errores | Diagnosticar fallos | Registros técnicos, que pueden incluir un identificador de usuario |
| Google Analytics 4 | Estadísticas de audiencia | Véase la sección 7; solo con consentimiento |
| Red blockchain pública | Liquidar donaciones en criptomoneda | Dirección de la cartera, importe y mensaje — **públicos y permanentes** |

> **Personalizar:** los proveedores actualmente utilizados son **Stripe** (tarjeta de crédito) y **AbacatePay** (PIX). Esta lista puede actualizarse si cambian los proveedores; la categoría y la finalidad del tratamiento, en cambio, siguen siendo las descritas.

### 5.2 Otros supuestos de comunicación

También podrán comunicarse datos cuando exista:

- **orden judicial o requerimiento de autoridad competente**, dentro de los límites legales;
- **necesidad de ejercer derechos** en un proceso judicial, administrativo o arbitral;
- **investigación de fraude, abuso o amenaza a la seguridad** de los usuarios o del servicio;
- **consentimiento específico e informado** por tu parte.

Si el proyecto llegara a ser objeto de sucesión, transferencia o cese, se te informará por correo electrónico y/o mediante aviso en el Sitio antes de que cualquier cambio de responsable produzca efectos, pudiendo solicitar la supresión de tus datos.

### 5.3 Transferencias internacionales de datos

Algunos encargados tienen su sede fuera de Brasil, principalmente en Estados Unidos y la Unión Europea. Esto constituye una **transferencia internacional de datos**, admitida por el art. 33 de la LGPD.

Estas transferencias se producen porque son **necesarias para la ejecución del contrato** contigo (art. 33, VI) y, cuando procede, se amparan en **cláusulas contractuales tipo** y en los compromisos de cumplimiento que ofrecen los propios proveedores. Para visitantes sujetos al RGPD, las bases correspondientes son los arts. 46 y 49 del Reglamento.

## 6. Dónde se almacenan los datos y cómo se protegen

Los datos se almacenan en una base de datos PostgreSQL, con caché en Redis y archivos estáticos en almacenamiento de objetos, alojados por proveedores de infraestructura profesionales.

Medidas técnicas y organizativas adoptadas:

- **Cifrado en tránsito** (HTTPS/TLS) en todas las páginas y peticiones;
- **Contraseñas almacenadas solo como *hash***, con bcrypt y *salt* individual;
- **Saneamiento de todo el contenido enviado por usuarios** antes de renderizarlo, para prevenir inyección de scripts (XSS);
- **Limitación de peticiones** en rutas sensibles (inicio de sesión, registro, comentarios, donaciones);
- **Control de acceso** al panel de administración, restringido a cuentas con privilegio explícito;
- **Rutinas de copia de seguridad** de la base de datos;
- **Monitorización de errores y disponibilidad**, con página pública de estado;
- **Verificación automatizada de enlaces** frente a bases de datos de seguridad;
- **Secretos y claves de API** fuera del código fuente, en variables de entorno.

**Una declaración honesta sobre seguridad.** Ningún sistema conectado a internet es absolutamente seguro. El compromiso aquí asumido es adoptar medidas técnicas y administrativas **aptas y proporcionales al riesgo**, conforme al art. 46 de la LGPD, no garantizar la invulnerabilidad, lo que sería jurídicamente imposible de cumplir.

**Incidentes de seguridad.** En caso de incidente que pueda suponer riesgo o daño relevante, se comunicará a la Autoridad Nacional de Protección de Datos de Brasil y a los titulares afectados en un plazo razonable, con la descripción de lo ocurrido, los datos implicados y las medidas adoptadas, conforme al art. 48 de la LGPD.

## 7. Cookies y tecnologías similares

Las cookies son pequeños archivos que se guardan en tu navegador. El Sitio utiliza las siguientes categorías:

### 7.1 Cookies estrictamente necesarias

Siempre activas, porque sin ellas el Sitio no funciona. No requieren consentimiento.

| Finalidad | Ejemplos |
|---|---|
| Mantener tu sesión iniciada | Cookies de sesión de NextAuth |
| Registrar tu elección sobre cookies | `cookie_consent` (validez de 12 meses) |
| Evitar el recuento doble de visualizaciones de artículos | Cookie técnica con validez de 30 minutos |
| Seguridad y protección CSRF | Cookies de protección del framework |

### 7.2 Cookies analíticas (opcionales)

El Sitio utiliza **Google Analytics 4** para saber qué contenidos se leen más y cómo mejorar la navegación.

- Los scripts de Google Analytics **solo se cargan después de que hagas clic en "Aceptar"** en el aviso de cookies. Si rechazas o ignoras el aviso, **no se ejecuta ningún script analítico**.
- La recogida está configurada con **anonimización de IP**.
- Los datos se usan de forma **agregada y estadística**, para métricas como páginas más visitadas, origen del tráfico y comportamiento de navegación.
- **Estos datos no se usan para publicidad personalizada**, no alimentan redes publicitarias y no se cruzan con tu perfil en el Sitio.

### 7.3 Cómo gestionarlas

Si rechazas las cookies opcionales, el Sitio elimina activamente las cookies no esenciales presentes en tu navegador. También puedes borrar cookies y ajustar preferencias en la configuración de tu navegador en cualquier momento. Restringir las cookies necesarias puede impedir el inicio de sesión y otras funciones básicas.

Para revocar un consentimiento ya prestado, borra la cookie `cookie_consent`: el aviso reaparecerá en tu próxima visita.

## 8. Durante cuánto tiempo se conservan los datos

| Categoría | Plazo de conservación |
|---|---|
| Datos de cuenta | Mientras la cuenta esté activa |
| Contenido público (comentarios, mensajes del Wall, votos, "me gusta") | Mientras esté publicado; tras la supresión de la cuenta permanece de forma **anonimizada** (véase la sección 10) |
| Suscripción al boletín | Hasta la baja. Después se conserva un registro mínimo de la baja para impedir reinscripciones indebidas y acreditar tu manifestación de voluntad |
| Registros de donación | Durante el plazo exigido por la legislación fiscal y civil aplicable, desde la transacción |
| Registros de acceso a la aplicación | 6 meses, conforme al art. 15 del Marco Civil de Internet, prorrogables por orden judicial |
| Dirección IP para limitación de peticiones | De minutos a horas, con expiración automática en caché |
| Registros de error y diagnóstico | Según la política de retención del servicio de monitorización, típicamente hasta 90 días |
| Mensajes del formulario de contacto | Mientras sean útiles para la relación a la que se destinan, y como máximo **24 meses** desde el envío. Pueden suprimirse antes, en cualquier momento, a petición del remitente |
| Registros de expulsión | Mientras sea necesario para impedir la reincidencia y para el ejercicio regular de derechos |
| Datos de donaciones en blockchain | **Permanentes e irreversibles por naturaleza** — véase la sección 9.3 |

Finalizado el plazo o la finalidad, los datos se suprimen o se anonimizan, salvo en los supuestos del art. 16 de la LGPD (cumplimiento de obligación legal, estudio por organismo de investigación con anonimización, transferencia a terceros conforme a la ley y uso exclusivo del responsable en forma anonimizada).

## 9. Apoyo económico y donaciones

La página `/support` permite apoyar el Sitio mediante una aportación voluntaria ("invítame a un café"). Se trata de una **liberalidad**, sin contraprestación comercial, sin entrega de producto y sin prestación de servicio.

### 9.1 Pagos con PIX y tarjeta de crédito

Los pagos los procesan **pasarelas de pago externas, especializadas y debidamente constituidas**, que operan bajo estándares de seguridad del sector (incluido PCI DSS en el caso de tarjetas).

- Los datos financieros se introducen **directamente en el entorno de la pasarela**;
- El Sitio **no recibe, no visualiza ni almacena** número de tarjeta, código de seguridad, fecha de caducidad ni credenciales bancarias;
- El Sitio almacena únicamente el **identificador de la transacción** devuelto por la pasarela, además del importe, la moneda y el estado del cobro;
- La confirmación se comunica mediante *webhooks* firmados y validados.

**Reembolso.** Las solicitudes de devolución o reembolso de pagos con PIX o tarjeta se rigen por las **normas, plazos y procedimientos de la pasarela de pago utilizada**, sobre los que el Sitio no tiene control unilateral. Las solicitudes deben enviarse a {{CONTACT_EMAIL}}, que las trasladará a la pasarela. El Sitio actuará de buena fe para viabilizar la devolución cuando sea técnicamente posible y legalmente debida, pero **no puede garantizar el resultado**, que depende de la política de la pasarela y de la entidad financiera implicada.

### 9.2 Donaciones recurrentes

Si eliges una aportación mensual, el cobro recurrente lo gestiona la pasarela de pago. La cancelación puede solicitarse en cualquier momento por el canal de contacto y surte efecto a partir del siguiente ciclo de facturación.

### 9.3 Donaciones en criptomoneda (ETH, USDT y USDC)

Las donaciones en criptoactivos se realizan **directamente en la blockchain**, de cartera a cartera, sin intermediación del Sitio.

Debes tener presente que:

- **Las transacciones en blockchain son irreversibles.** Una vez confirmada, la transferencia **no puede cancelarse, devolverse ni revertirse** por nadie: ni por el Sitio, ni por tu cartera, ni por ninguna autoridad. **No existe reembolso para donaciones en criptomoneda.**
- **Verificar la red es responsabilidad tuya.** Los envíos hechos en la red incorrecta, a una dirección incorrecta o con un activo no soportado pueden provocar la **pérdida definitiva de los fondos**, sin responsabilidad alguna del Sitio.
- **La dirección de tu cartera, el importe y el mensaje quedan registrados públicamente** en la blockchain y cualquier persona puede consultarlos indefinidamente. Es una característica de la tecnología, no una decisión del Sitio.
- **Los registros en blockchain no pueden borrarse.** El derecho de supresión previsto en el art. 18, VI de la LGPD es, en este punto, **técnicamente inejecutable**. Lo que el Sitio puede hacer —y hará si se le solicita— es retirar la exhibición de esos datos en su interfaz y desvincular el registro de tu cuenta.
- Puedes marcar la donación como **privada**, en cuyo caso el nombre y el mensaje no se muestran públicamente en el Sitio (el registro en la blockchain, sin embargo, sigue siendo público).
- Los criptoactivos son **volátiles**. La conversión mostrada en el Sitio es meramente informativa.

## 10. Tus derechos como titular

Conforme al art. 18 de la LGPD, puedes solicitar en cualquier momento y de forma gratuita:

| Derecho | Qué significa en la práctica |
|---|---|
| **Confirmación y acceso** | Saber si hay tratamiento y obtener copia de tus datos |
| **Rectificación** | Corregir datos incompletos, inexactos o desactualizados |
| **Anonimización, bloqueo o supresión** | Eliminar datos innecesarios, excesivos o tratados de forma no conforme con la ley |
| **Portabilidad** | Recibir tus datos en formato estructurado e interoperable |
| **Supresión de los datos tratados con base en el consentimiento** | P. ej., darte de baja del boletín y eliminar el registro correspondiente |
| **Información sobre la comunicación de datos** | Saber con qué entidades públicas y privadas se han compartido tus datos |
| **Información sobre la posibilidad de no consentir** | Conocer las consecuencias de la negativa |
| **Revocación del consentimiento** | Retirar en cualquier momento los consentimientos prestados |
| **Oposición** | Oponerte a tratamientos basados en el interés legítimo |
| **Reclamación ante la ANPD** | Reclamar directamente ante la autoridad nacional brasileña |

Las personas visitantes en el Espacio Económico Europeo disponen además de los derechos de los arts. 15 a 22 del RGPD, incluido el de presentar una reclamación ante la autoridad de control de su país.

### 10.1 Supresión de la cuenta

Puedes cerrar tu cuenta en cualquier momento desde la configuración del perfil o solicitándolo por el canal de contacto.

Con la supresión:

- **Se eliminan:** correo electrónico, nombre de usuario, *hash* de la contraseña, avatar, identificador del proveedor OAuth, descripción personal, enlaces de perfil, tokens de recuperación de contraseña y la vinculación de la cuenta con donaciones y con el boletín.
- **Se conservan de forma anonimizada:** comentarios, respuestas, votos y mensajes del Guestbook/Wall. El contenido sigue visible, pero **pasa a mostrarse como de un "usuario eliminado"**, sin vínculo alguno contigo. La anonimización preserva la integridad y la coherencia de las conversaciones públicas en las que participaron otras personas, y el art. 18, IV de la LGPD la admite expresamente como alternativa a la supresión. Si además quieres **eliminar el contenido en sí**, borra o solicita la eliminación de tus comentarios y mensajes **antes** de cerrar la cuenta.
- **Se conservan:** los registros de donación, en lo exigido por la legislación fiscal y contable; los registros de acceso, durante el plazo del art. 15 del Marco Civil de Internet; y los registros de expulsión, cuando procedan, el tiempo necesario para el ejercicio regular de derechos.
- **No pueden eliminarse:** los registros de transacciones en blockchain (sección 9.3).

### 10.2 Cómo ejercer tus derechos

Envía tu solicitud a **{{PRIVACY_EMAIL}}**, preferiblemente desde el correo registrado en tu cuenta, describiendo el derecho que deseas ejercer.

La solicitud se responderá **en un plazo máximo de 15 (quince) días**, conforme al art. 19, II de la LGPD. Si no fuera posible atenderla de inmediato, recibirás una respuesta motivada indicando la razón de hecho o de derecho.

Podrá solicitarse una **verificación adicional de identidad** antes de atender la petición, únicamente para proteger tu cuenta frente a solicitudes fraudulentas de terceros.

## 11. Menores de edad

El Sitio **no está dirigido a menores de 18 años** y no recoge intencionadamente datos de niños y niñas.

Conforme al art. 14 de la LGPD, el tratamiento de datos de menores de 12 años exige **consentimiento específico y destacado de al menos uno de los progenitores o del representante legal**. Los adolescentes deben utilizar el Sitio con la supervisión y el conocimiento de sus responsables.

Si eres representante legal y detectas que un menor a tu cargo ha creado una cuenta o publicado contenido, escribe a {{PRIVACY_EMAIL}}: la cuenta y el contenido se eliminarán con carácter prioritario.

## 12. Modificaciones de esta Política

Esta Política puede actualizarse para reflejar cambios en las funcionalidades del Sitio, en los proveedores utilizados o en la legislación aplicable.

- La fecha de **última actualización** y el número de **versión** figuran al inicio del documento.
- Los cambios **sustanciales** —como nuevas finalidades de tratamiento, nuevas categorías de datos o cambio de base legal— se comunicarán mediante aviso destacado en el Sitio y, cuando haya consentimiento implicado, por correo electrónico, con antelación razonable.
- El uso continuado del Sitio tras la entrada en vigor de la nueva versión indica conocimiento de los cambios. Cuando el cambio dependa del consentimiento, este se solicitará de nuevo.

## 13. Contacto

Para dudas, solicitudes, reclamaciones o para ejercer cualquier derecho previsto en esta Política:

**Correo electrónico:** {{PRIVACY_EMAIL}}
**Dirección:** {{ADDRESS}}
**Plazo de respuesta:** hasta 15 días

Si consideras que tu solicitud no ha sido atendida adecuadamente, puedes reclamar ante la **Autoridad Nacional de Protección de Datos de Brasil (ANPD)** — [www.gov.br/anpd](https://www.gov.br/anpd) — o, si te encuentras en el Espacio Económico Europeo, ante la autoridad de control de tu país.

---

*Este documento forma parte de, y debe leerse junto con, los [Términos de Uso](/legal/terms).*
