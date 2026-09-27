# Política de Privacidade

**Última atualização:** {{EFFECTIVE_DATE}}
**Versão:** 1.0

Esta Política de Privacidade descreve como os dados pessoais dos visitantes e usuários de **{{DOMAIN}}** ("Site") são coletados, utilizados, compartilhados, armazenados e protegidos.

O Site é um portfólio pessoal e blog técnico. Ele não é um serviço comercial de larga escala, mas trata dados pessoais reais e, por isso, segue a **Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais — LGPD)** e, quando aplicável a visitantes no Espaço Econômico Europeu, o **Regulamento (UE) 2016/679 (GDPR)**.

Leia este documento com atenção. Ao criar uma conta, comentar, assinar a newsletter ou apoiar o Site, você declara ter compreendido as práticas aqui descritas.

## 1. Quem é o controlador dos dados

| | |
|---|---|
| **Controlador** | {{OWNER}} |
| **Endereço** | {{ADDRESS}} |
| **Contato para privacidade** | {{PRIVACY_EMAIL}} |
| **País de operação** | Brasil |

O Site é mantido por uma pessoa física. Não há Encarregado (DPO) formalmente designado, o que é dispensado neste porte de tratamento nos termos da regulamentação da ANPD aplicável a agentes de pequeno porte. O canal de contato acima cumpre a função prevista no art. 41, § 2º, da LGPD.

## 2. Princípio orientador: coleta mínima

O Site foi projetado para **coletar o mínimo necessário**. Em particular:

- **Nenhum dado pessoal é vendido, alugado ou cedido** a terceiros para fins comerciais.
- **Nenhum dado é utilizado para publicidade personalizada**, remarketing ou construção de perfis publicitários.
- **Não há venda de dados a corretores de dados** (*data brokers*).
- **Não são coletados dados sensíveis** (art. 5º, II, da LGPD): origem racial ou étnica, convicção religiosa, opinião política, filiação sindical, dados referentes à saúde, à vida sexual, genéticos ou biométricos. Pedimos que você **não inclua** esse tipo de informação em comentários, mensagens ou no seu perfil.
- **Não há decisões automatizadas com efeitos jurídicos** sobre você, exceto a filtragem automática de conteúdo enviado por usuários (seção 5.1), que é sempre passível de revisão humana.

## 3. Quais dados são coletados

Os dados abaixo refletem exatamente o que a aplicação armazena. Nem todos se aplicam a você: a maior parte só existe se você optar por usar a funcionalidade correspondente.

### 3.1 Dados de conta (se você criar uma conta)

O núcleo da sua conta é composto por **nome de usuário, e-mail e avatar**. Além disso, dependendo do método de autenticação escolhido:

| Dado | Origem | Observação |
|---|---|---|
| Endereço de e-mail | Você ou o provedor OAuth | Identificador único da conta |
| Nome de usuário (*username*) | Gerado a partir do e-mail/nome ou escolhido por você | Público |
| Avatar (URL da imagem) | Provedor OAuth (Google/GitHub) | Público. A imagem permanece hospedada pelo provedor |
| Senha | Você, apenas no cadastro por e-mail e senha | Armazenada exclusivamente como *hash* criptográfico (bcrypt). **A senha em texto legível nunca é armazenada nem é conhecida pelo controlador** |
| Identificador do provedor OAuth | Google ou GitHub | Código técnico que vincula sua conta ao provedor. Não dá acesso à sua conta no provedor |
| Status de verificação do e-mail | Sistema | — |
| Datas de criação e atualização | Sistema | — |

Quando você entra com Google ou GitHub, o Site recebe desses provedores apenas **e-mail, nome, foto de perfil e um identificador**. O Site **não** recebe sua senha, seus contatos, seus repositórios privados nem qualquer outro conteúdo da sua conta.

### 3.2 Dados de perfil público (opcionais, fornecidos por você)

Se você preencher, o Site armazena e **exibe publicamente**: uma breve descrição pessoal ("sobre"), o link do seu perfil no GitHub e o link do seu perfil no LinkedIn. Esses campos são inteiramente opcionais e podem ser esvaziados a qualquer momento nas configurações do perfil.

### 3.3 Conteúdo gerado por você

São armazenados e **exibidos publicamente**, associados ao seu nome de usuário e avatar:

- comentários em artigos (e respostas a comentários);
- votos em comentários;
- curtidas em artigos;
- mensagens publicadas no Guestbook/Wall.

Considere que qualquer conteúdo publicado nessas áreas é **público, indexável por mecanismos de busca e potencialmente copiável por terceiros**. Não publique informações que você não queira tornar públicas.

### 3.4 Newsletter (apenas com consentimento)

A newsletter opera em regime de **opt-in com dupla confirmação**: após a inscrição, você recebe um e-mail e a inscrição só é ativada se você clicar no link de confirmação.

São armazenados: endereço de e-mail, idioma preferido, situação da inscrição, datas de inscrição/confirmação/cancelamento e tokens aleatórios usados para confirmar e para cancelar a inscrição.

**Métricas de envio.** Os e-mails da newsletter contêm um pixel de rastreamento que registra **se e quantas vezes a mensagem foi aberta**, além do status de entrega. Essa métrica é usada apenas para avaliar a qualidade do conteúdo e a saúde do envio. Se você preferir não ser contabilizado, basta bloquear o carregamento de imagens no seu cliente de e-mail — o conteúdo continuará legível.

Todo e-mail da newsletter contém um link de cancelamento de um clique, válido permanentemente.

### 3.5 Apoio financeiro (página `/support`)

Consulte também a **seção 9**, que detalha o funcionamento das doações.

O Site armazena, por doação: nome de exibição (opcional), mensagem pública (opcional), quantidade de "cafés", valor, moeda, meio de pagamento, situação da cobrança, indicador de doação privada e o **identificador da transação gerado pelo processador de pagamento**.

O Site **não armazena** números de cartão, CVV, validade, dados bancários ou credenciais financeiras. Esses dados são inseridos e processados diretamente no ambiente do processador de pagamento e nunca transitam pelo banco de dados do Site.

No fluxo de PIX, os dados exigidos pela regulamentação do meio de pagamento (nome, e-mail, telefone e CPF) são **transmitidos diretamente ao processador** para emissão da cobrança e **não são persistidos** no banco de dados do Site.

Nas doações em criptomoeda, são registrados: endereço da carteira de origem, *hash* da transação, rede, ativo, valor, número do bloco e a mensagem opcional. Esses dados **já são públicos por natureza**, pois constam da blockchain (veja a seção 9.3).

### 3.6 Formulário de contato

O formulário de contato coleta **nome, e-mail, assunto e o texto da mensagem**. Desde a última atualização desta política, as mensagens **são gravadas no banco de dados do Site** e deixaram de transitar por um serviço terceirizado de encaminhamento de formulários.

Junto da mensagem são registrados, para prevenção a abuso: o **idioma** da página, o **agente de usuário** do navegador e um **identificador derivado do endereço IP**. Esse identificador é o resultado de uma função de resumo criptográfico (SHA-256) aplicada ao IP com um segredo do servidor — **o endereço IP em si não é armazenado** e o identificador não permite reconstruí-lo. Ele serve apenas para reconhecer que várias mensagens vieram da mesma origem.

O envio é protegido pelo **Cloudflare Turnstile**, um mecanismo de verificação antiautomação que substitui o CAPTCHA tradicional (veja a seção 5.1).

### 3.7 Dados técnicos e de segurança

| Dado | Finalidade | Onde fica |
|---|---|---|
| Endereço IP | Limitação de taxa de requisições (*rate limiting*) e prevenção a abuso, spam e ataques automatizados | Armazenamento temporário em cache (Redis), com expiração automática em curto prazo |
| Registros de erro e desempenho | Diagnóstico de falhas e estabilidade | Serviço de monitoramento de erros |
| Registros de acesso à aplicação | Cumprimento do art. 15 da Lei nº 12.965/2014 (Marco Civil da Internet) | Servidor/infraestrutura |
| Cookies e identificadores | Ver seção 7 | Seu navegador |
| Métricas agregadas de audiência | Estatísticas de leitura | Google Analytics 4, somente com consentimento |
| Contagem de visualizações de artigos | Estatística editorial | Cookie técnico de curta duração + contador agregado. Não identifica o leitor |

## 4. Por que os dados são coletados e qual a base legal

A LGPD exige que todo tratamento tenha uma hipótese legal. A tabela abaixo indica a base adotada para cada finalidade.

| Finalidade | Dados envolvidos | Base legal (LGPD) |
|---|---|---|
| Criar e manter sua conta; autenticar o acesso | Conta (3.1) | Art. 7º, V — execução de contrato ou de procedimentos preliminares |
| Exibir seu perfil público, comentários, votos e mensagens | 3.2 e 3.3 | Art. 7º, V — execução de contrato |
| Recuperação de senha | E-mail e token temporário | Art. 7º, V |
| Enviar a newsletter | E-mail e preferências (3.4) | Art. 7º, I — **consentimento**, revogável a qualquer momento |
| Medir abertura e entrega da newsletter | Métricas de campanha (3.4) | Art. 7º, IX — legítimo interesse na qualidade e na entregabilidade do envio |
| Processar e registrar apoios financeiros | 3.5 | Art. 7º, V — execução de contrato; e Art. 7º, II — cumprimento de obrigação legal e regulatória |
| Responder mensagens de contato | 3.6 | Art. 7º, V e IX |
| Moderar conteúdo, prevenir spam, golpes, *phishing* e abuso | Texto de comentários, URLs, IP, dados de conta | Art. 7º, IX — legítimo interesse na segurança dos usuários e na integridade do serviço |
| Aplicar suspensões e banimentos e manter seu registro | Conta e motivo do bloqueio | Art. 7º, IX e VI — legítimo interesse e exercício regular de direitos |
| Manter a segurança, disponibilidade e diagnóstico do Site | Dados técnicos (3.7) | Art. 7º, IX |
| Guardar registros de acesso à aplicação | Registros de conexão | Art. 7º, II — cumprimento de obrigação legal (Marco Civil da Internet, art. 15) |
| Produzir estatísticas de audiência com cookies analíticos | Ver seção 7 | Art. 7º, I — **consentimento** |
| Defender-se em processos judiciais, administrativos ou arbitrais | Conforme necessário | Art. 7º, VI |

Quando o legítimo interesse é a base adotada, o tratamento se limita ao estritamente necessário para a finalidade declarada, e você pode se opor a ele pelo canal indicado na seção 12.

## 5. Com quem os dados são compartilhados

O Site **não vende dados**. O compartilhamento ocorre apenas com **operadores** que executam funções indispensáveis ao funcionamento do serviço, sempre limitado ao mínimo necessário.

### 5.1 Categorias de operadores

| Categoria | Para que serve | Dados transmitidos |
|---|---|---|
| Provedores de autenticação (Google, GitHub) | Login social | Confirmação de identidade; recebemos e-mail, nome, avatar e identificador |
| Processador de pagamento por cartão | Cobrança e antifraude | Dados do cartão (inseridos diretamente no ambiente do processador), valor e metadados da doação |
| Processador de pagamento por PIX | Emissão e liquidação da cobrança | Nome, e-mail, telefone e CPF do pagador, quando informados; valor |
| Provedor de infraestrutura e hospedagem | Executar a aplicação e o banco de dados | Todos os dados armazenados, sob contrato e em regime de confidencialidade |
| Serviço de envio de e-mails transacionais e newsletter | Entregar confirmações, recuperação de senha e campanhas | E-mail do destinatário e conteúdo da mensagem |
| Serviço de verificação antiautomação (*CAPTCHA*) | Distinguir pessoas de robôs no formulário de contato | Sinais técnicos do navegador e endereço IP, enviados diretamente pelo seu navegador ao prestador |
| Serviço de mensageria instantânea | Avisar o controlador de que chegou uma mensagem nova | Nome, assunto e um trecho inicial da mensagem |
| Serviço de moderação automatizada de conteúdo | Detectar conteúdo abusivo antes da publicação | Texto do comentário ou mensagem |
| Serviço de verificação de segurança de URLs | Bloquear links de *phishing* e malware | URLs contidas no conteúdo enviado |
| Serviço de monitoramento de erros | Diagnosticar falhas | Registros técnicos, que podem conter identificador de usuário |
| Google Analytics 4 | Estatísticas de audiência | Ver seção 7; somente com consentimento |
| Rede blockchain pública | Liquidar doações em criptomoeda | Endereço da carteira, valor e mensagem — **públicos e permanentes** |

> **Personalizar:** os prestadores atualmente utilizados são o **Stripe** (cartão de crédito) e o **AbacatePay** (PIX). Esta lista pode ser atualizada caso os prestadores mudem; a categoria e a finalidade do tratamento, contudo, permanecem as descritas acima.

### 5.2 Outras hipóteses de compartilhamento

Dados também poderão ser compartilhados quando houver:

- **ordem judicial ou requisição de autoridade competente**, nos limites da lei;
- **necessidade de exercício regular de direitos** em processo judicial, administrativo ou arbitral;
- **investigação de fraude, abuso ou ameaça à segurança** de usuários ou do serviço;
- **consentimento específico e informado** dado por você.

Se houver eventual sucessão, transferência ou descontinuação do projeto, você será informado por e-mail e/ou aviso no Site antes que qualquer mudança de controlador produza efeitos, podendo solicitar a exclusão dos seus dados.

### 5.3 Transferência internacional de dados

Alguns operadores estão sediados fora do Brasil, notadamente nos Estados Unidos e na União Europeia. Isso caracteriza **transferência internacional de dados**, admitida pelo art. 33 da LGPD.

Essas transferências ocorrem porque são **necessárias à execução do contrato** com você (art. 33, VI) e, quando aplicável, amparadas em **cláusulas contratuais padrão** e nos compromissos de conformidade oferecidos pelos próprios prestadores. Para visitantes sujeitos ao GDPR, as bases correspondentes são os arts. 46 e 49 do Regulamento.

## 6. Onde os dados ficam e como são protegidos

Os dados são armazenados em banco de dados PostgreSQL, com cache em Redis e arquivos estáticos em armazenamento de objetos, hospedados por provedores de infraestrutura profissionais.

Medidas técnicas e organizacionais adotadas:

- **Criptografia em trânsito** (HTTPS/TLS) em todas as páginas e requisições;
- **Senhas armazenadas apenas como *hash*** com algoritmo bcrypt e *salt* individual;
- **Sanitização de todo conteúdo enviado por usuários** antes da renderização, para prevenir injeção de scripts (XSS);
- **Limitação de taxa de requisições** em rotas sensíveis (login, cadastro, comentários, doações);
- **Controle de acesso** ao painel administrativo restrito a contas com privilégio explícito;
- **Rotinas de backup** do banco de dados;
- **Monitoramento de erros e disponibilidade**, com página pública de status;
- **Verificação automatizada de links** contra bases de segurança;
- **Segredos e chaves de API** mantidos fora do código-fonte, em variáveis de ambiente.

**Declaração honesta sobre segurança.** Nenhum sistema conectado à internet é absolutamente seguro. O compromisso aqui assumido é o de adotar medidas técnicas e administrativas **aptas e proporcionais ao risco**, na forma do art. 46 da LGPD — não o de garantir invulnerabilidade, o que seria juridicamente impossível de cumprir.

**Incidentes de segurança.** Em caso de incidente que possa acarretar risco ou dano relevante, a Autoridade Nacional de Proteção de Dados e os titulares afetados serão comunicados em prazo razoável, com a descrição do ocorrido, dos dados envolvidos e das medidas adotadas, conforme o art. 48 da LGPD.

## 7. Cookies e tecnologias semelhantes

Cookies são pequenos arquivos gravados no seu navegador. O Site utiliza as seguintes categorias:

### 7.1 Cookies estritamente necessários

Sempre ativos, pois sem eles o Site não funciona. Não exigem consentimento.

| Finalidade | Exemplos |
|---|---|
| Manter sua sessão autenticada | Cookies de sessão do NextAuth |
| Registrar sua escolha sobre cookies | `cookie_consent` (validade de 12 meses) |
| Evitar contagem duplicada de visualizações de artigos | Cookie técnico com validade de 30 minutos |
| Segurança e proteção contra CSRF | Cookies de proteção do framework |

### 7.2 Cookies analíticos (opcionais)

O Site utiliza o **Google Analytics 4** para entender quais conteúdos são mais lidos e como melhorar a navegação.

- Os scripts do Google Analytics **só são carregados após você clicar em "Aceitar"** no aviso de cookies. Se você recusar ou ignorar o aviso, **nenhum script analítico é executado**.
- A coleta é configurada com **anonimização de IP**.
- Os dados são usados de forma **agregada e estatística**, para métricas como páginas mais acessadas, origem do tráfego e comportamento de navegação.
- **Esses dados não são usados para publicidade personalizada**, não alimentam redes de anúncios e não são cruzados com o seu perfil no Site.

### 7.3 Como gerenciar

Ao recusar os cookies opcionais, o Site remove ativamente os cookies não essenciais presentes no seu navegador. Você também pode, a qualquer momento, apagar cookies e ajustar as preferências diretamente nas configurações do seu navegador. Restringir cookies necessários pode impedir o login e outras funcionalidades básicas.

Para revogar um consentimento já dado, apague o cookie `cookie_consent` — o aviso reaparecerá na próxima visita.

## 8. Por quanto tempo os dados são mantidos

| Categoria | Prazo de retenção |
|---|---|
| Dados de conta | Enquanto a conta estiver ativa |
| Conteúdo público (comentários, mensagens do Wall, votos, curtidas) | Enquanto publicado; após a exclusão da conta, permanece de forma **anonimizada** (ver seção 10) |
| Inscrição na newsletter | Até o cancelamento. Após o cancelamento, mantém-se o registro mínimo da baixa para impedir reinscrição indevida e comprovar a manifestação de vontade |
| Registros de doação | Pelo prazo exigido pela legislação fiscal e civil aplicável, contado da transação |
| Registros de acesso à aplicação | 6 meses, nos termos do art. 15 do Marco Civil da Internet, podendo ser prorrogado por ordem judicial |
| Endereço IP para limitação de taxa | Minutos a horas, com expiração automática em cache |
| Registros de erro e diagnóstico | Conforme a política de retenção do serviço de monitoramento, tipicamente até 90 dias |
| Mensagens do formulário de contato | Enquanto úteis para o relacionamento a que se destinam, e no máximo **24 meses** contados do envio. Podem ser excluídas antes disso, a qualquer momento, a pedido do remetente |
| Registros de banimento | Enquanto necessário para impedir a reincidência e para exercício regular de direitos |
| Dados de doações em blockchain | **Permanentes e irreversíveis por natureza** — ver seção 9.3 |

Encerrado o prazo ou a finalidade, os dados são eliminados ou anonimizados, ressalvadas as hipóteses do art. 16 da LGPD (cumprimento de obrigação legal, estudo por órgão de pesquisa com anonimização, transferência a terceiro com observância da lei e uso exclusivo do controlador em forma anonimizada).

## 9. Apoio financeiro e doações

A página `/support` oferece a possibilidade de apoiar o Site por meio de uma contribuição voluntária ("me pague um café"). Trata-se de **liberalidade**, sem contrapartida comercial, sem entrega de produto e sem prestação de serviço.

### 9.1 Pagamentos por PIX e cartão de crédito

Os pagamentos são processados por **plataformas de pagamento terceirizadas, especializadas e regularmente constituídas**, que operam sob padrões de mercado de segurança (incluindo, no caso de cartões, o padrão PCI DSS).

- Os dados financeiros são inseridos **diretamente no ambiente do processador**;
- O Site **não recebe, não visualiza e não armazena** número de cartão, código de segurança, validade ou credenciais bancárias;
- O Site armazena apenas o **identificador da transação** devolvido pelo processador, além do valor, da moeda e da situação da cobrança;
- A comunicação de confirmação ocorre por *webhooks* assinados e validados.

**Reembolso.** Pedidos de estorno ou reembolso de pagamentos por PIX ou cartão seguem as **regras, os prazos e os procedimentos da plataforma de pagamento utilizada**, sobre os quais o Site não tem controle unilateral. Solicitações devem ser encaminhadas para {{CONTACT_EMAIL}}, que dará o encaminhamento cabível junto ao processador. O Site atuará de boa-fé para viabilizar o estorno quando este for tecnicamente possível e legalmente devido, mas **não pode garantir o resultado**, que depende da política do processador e da instituição financeira envolvida.

### 9.2 Doações recorrentes

Caso você opte por uma contribuição mensal, a cobrança recorrente é gerida pela plataforma de pagamento. O cancelamento pode ser solicitado a qualquer momento pelo canal de contato, e produz efeitos a partir do próximo ciclo de cobrança.

### 9.3 Doações em criptomoeda (ETH, USDT e USDC)

As doações em criptoativos são realizadas **diretamente na blockchain**, de carteira para carteira, sem intermediação do Site.

Você precisa estar ciente de que:

- **Transações em blockchain são irreversíveis.** Uma vez confirmada, a transferência **não pode ser cancelada, estornada ou revertida** por ninguém — nem pelo Site, nem pela sua carteira, nem por qualquer autoridade. **Não existe reembolso para doações em criptomoeda.**
- **É sua responsabilidade conferir a rede antes de enviar.** Envios feitos na rede incorreta, para endereço incorreto ou com ativo não suportado podem resultar em **perda definitiva dos fundos**, sem qualquer responsabilidade do Site.
- **O endereço da sua carteira, o valor e a mensagem ficam registrados publicamente** na blockchain e podem ser consultados por qualquer pessoa, indefinidamente. Isso é uma característica da tecnologia, não uma escolha do Site.
- **Registros em blockchain não podem ser apagados.** O direito de eliminação previsto no art. 18, VI, da LGPD é, nesse ponto, **tecnicamente inexequível**. O que o Site pode fazer — e fará, mediante solicitação — é remover a exibição desses dados na interface do Site e desvincular o registro da sua conta.
- Você pode marcar a doação como **privada**, hipótese em que nome e mensagem não são exibidos publicamente no Site (o registro na blockchain, contudo, permanece público).
- Valores em criptoativos são **voláteis**. A conversão exibida no Site é meramente informativa.

## 10. Seus direitos como titular

Nos termos do art. 18 da LGPD, você pode, a qualquer momento e gratuitamente, requerer:

| Direito | O que significa na prática |
|---|---|
| **Confirmação e acesso** | Saber se há tratamento e obter cópia dos seus dados |
| **Correção** | Corrigir dados incompletos, inexatos ou desatualizados |
| **Anonimização, bloqueio ou eliminação** | Remover dados desnecessários, excessivos ou tratados em desconformidade com a lei |
| **Portabilidade** | Receber seus dados em formato estruturado e interoperável |
| **Eliminação dos dados tratados com base no consentimento** | Ex.: cancelar a newsletter e remover o registro correspondente |
| **Informação sobre compartilhamento** | Saber com quais entidades públicas e privadas seus dados foram compartilhados |
| **Informação sobre a possibilidade de não consentir** | Conhecer as consequências da recusa |
| **Revogação do consentimento** | Retirar, a qualquer tempo, consentimentos anteriormente dados |
| **Oposição** | Opor-se a tratamentos fundados em legítimo interesse |
| **Peticionar perante a ANPD** | Reclamar diretamente à autoridade nacional |

Visitantes no Espaço Econômico Europeu dispõem ainda dos direitos previstos nos arts. 15 a 22 do GDPR, incluindo o direito de apresentar reclamação à autoridade supervisora do seu país.

### 10.1 Exclusão da conta

Você pode encerrar sua conta a qualquer momento pelas configurações de perfil ou solicitando pelo canal de contato.

Com a exclusão:

- **São eliminados:** e-mail, nome de usuário, *hash* de senha, avatar, identificador do provedor OAuth, descrição pessoal, links de perfil, tokens de recuperação de senha e a vinculação da conta a doações e à newsletter.
- **São mantidos de forma anonimizada:** comentários, respostas, votos e mensagens do Guestbook/Wall. O conteúdo continua visível, mas **passa a ser exibido como de um "usuário excluído"**, sem qualquer vínculo com você. A anonimização preserva a integridade e a coerência das conversas públicas em que outras pessoas participaram, e é expressamente admitida pelo art. 18, IV, da LGPD como alternativa à eliminação. Se você deseja também **remover o conteúdo em si**, exclua ou solicite a exclusão dos comentários e mensagens **antes** de encerrar a conta.
- **São mantidos:** registros de doação, no que for exigido pela legislação fiscal e contábil, e registros de acesso, pelo prazo do art. 15 do Marco Civil da Internet; registros de banimento, quando aplicáveis, pelo tempo necessário ao exercício regular de direitos.
- **Não podem ser removidos:** registros de transações em blockchain (seção 9.3).

### 10.2 Como exercer seus direitos

Envie um pedido para **{{PRIVACY_EMAIL}}**, preferencialmente a partir do e-mail cadastrado na sua conta, descrevendo o direito que deseja exercer.

O pedido será respondido em **até 15 (quinze) dias**, conforme o art. 19, II, da LGPD. Se não for possível atender de imediato, você receberá resposta fundamentada informando a razão de fato ou de direito.

Poderá ser solicitada uma **verificação adicional de identidade** antes do atendimento, exclusivamente para proteger sua conta contra pedidos fraudulentos de terceiros.

## 11. Crianças e adolescentes

O Site **não é direcionado a menores de 18 anos** e não coleta intencionalmente dados de crianças.

Nos termos do art. 14 da LGPD, o tratamento de dados de crianças (menores de 12 anos completos) exige **consentimento específico e destacado de ao menos um dos pais ou do responsável legal**. Adolescentes devem utilizar o Site com supervisão e ciência de seus responsáveis.

Se você é responsável legal e identificar que um menor sob sua guarda criou conta ou publicou conteúdo, escreva para {{PRIVACY_EMAIL}}: a conta e o conteúdo serão removidos com prioridade.

## 12. Alterações desta política

Esta Política pode ser atualizada para refletir mudanças nas funcionalidades do Site, nos prestadores utilizados ou na legislação aplicável.

- A data da **última atualização** e o número da **versão** constam no topo do documento.
- Alterações **substanciais** — como novas finalidades de tratamento, novas categorias de dados ou mudança de base legal — serão comunicadas por aviso em destaque no Site e, quando houver consentimento envolvido, por e-mail, com antecedência razoável.
- O uso continuado do Site após a entrada em vigor da nova versão indica ciência das alterações. Quando a mudança depender de consentimento, ele será solicitado novamente.

## 13. Contato

Para dúvidas, solicitações, reclamações ou para exercer qualquer direito previsto nesta Política:

**E-mail:** {{PRIVACY_EMAIL}}
**Endereço:** {{ADDRESS}}
**Prazo de resposta:** até 15 dias

Se você entender que sua solicitação não foi adequadamente atendida, pode apresentar reclamação à **Autoridade Nacional de Proteção de Dados (ANPD)** — [www.gov.br/anpd](https://www.gov.br/anpd) — ou, se estiver no Espaço Econômico Europeu, à autoridade supervisora do seu país.

---

*Este documento integra e deve ser lido em conjunto com os [Termos de Uso](/legal/terms).*
