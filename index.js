import fs from "fs/promises";
import * as inquirer from "@inquirer/prompts";
import chalk from "chalk";


const DB_FILE = "dados.json";

// 📂 Funções de persistência
async function carregarDados() {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function salvarDados(dados) {
  await fs.writeFile(DB_FILE, JSON.stringify(dados, null, 2));
}

async function menu() {
  let sair = false;

  while (!sair) {
    console.clear(); // limpa tudo antes de exibir o menu

    // Aguarda um pequeno delay (evita duplicações no VSCode e Windows)
    await new Promise((resolve) => setTimeout(resolve, 100));

    const opcao = await inquirer.select({
      message: chalk.cyanBright.bold("🎬 Catálogo de Filmes e Séries - Menu Principal:"),
      pageSize: 12, // evita rolagem e melhora a visualização
      choices: [
        { name:  chalk.green("1️⃣ Cadastrar nova mídia"), value: "cadastrar" },
        { name: chalk.yellow("2️⃣ Listar todas as mídias"), value: "listar" },
        { name: chalk.blue("3️⃣ Atualizar informações (episódios/nota)"), value: "atualizar" },
        { name: chalk.magenta("4️⃣ Filtrar por gênero ou plataforma"), value: "filtrar" },
        { name: chalk.cyan("5️⃣ Pesquisar por título"), value: "pesquisar" },
        { name: chalk.whiteBright("6️⃣ Ordenar lista"), value: "ordenar" },
        { name: chalk.greenBright("7️⃣ Ver estatísticas detalhadas"), value: "estatisticas" },
        { name: chalk.yellowBright("8️⃣ Ver ranking das melhores notas"), value: "ranking" },
        { name: chalk.red("9️⃣ Deletar mídia"), value: "deletar" },
        { name: chalk.gray("🚪 Sair"), value: "sair" },
      ],
    });

    switch (opcao) {
      case "cadastrar":
        await cadastrarMidia();
        break;
      case "listar":
        await listarMidias();
        break;
      case "atualizar":
        await atualizarMidia();
        break;
      case "filtrar":
        await filtrarMidias();
        break;
      case "pesquisar":
        await pesquisarMidia();
        break;
      case "ordenar":
        await ordenarMidias();
        break;
      case "estatisticas":
        await verEstatisticas();
        break;
      case "ranking":
        await verRanking();
        break;
      case "deletar":
        await deletarMidia();
        break;
      case "sair":
        sair = true;
        console.log("👋 Saindo... Até a próxima!");
        return;
    }

    const continuar = await inquirer.confirm({
      message: "Deseja voltar ao menu principal?",
    });

    if (!continuar) {
      sair = true;
      console.log("👋 Até a próxima!");
    }
  }
}

// 🧱 Cadastrar nova mídia
async function cadastrarMidia() {
  const dados = await carregarDados();

  const titulo = await inquirer.input({ message: "Título:" });
  const tipo = await inquirer.select({
    message: "Tipo:",
    choices: [
      { name: "Filme", value: "filme" },
      { name: "Série", value: "série" },
    ],
  });

  const genero = await inquirer.input({
    message: "Gêneros (separe por vírgulas, ex: ação, drama, aventura):",
  });
  const ano = Number(await inquirer.input({ message: "Ano de lançamento:" }));
  const plataforma = await inquirer.input({ message: "Plataforma (Netflix, Prime...):" });

  let temporadas = 0;
  let episodiosTotal = 0;
  let duracaoMedia = 0;

  if (tipo === "série") {
    temporadas = Number(await inquirer.input({ message: "Número de temporadas:" }));
    episodiosTotal = Number(await inquirer.input({ message: "Número total de episódios:" }));
    duracaoMedia = Number(await inquirer.input({ message: "Duração média dos episódios (min):" }));
  } else {
    duracaoMedia = Number(await inquirer.input({ message: "Duração do filme (min):" }));
  }

  const novaMidia = {
    id: Date.now(),
    titulo,
    tipo,
    genero,
    ano,
    plataforma,
    temporadas,
    episodiosTotal,
    episodiosAssistidos: 0,
    nota: null,
    duracaoMedia,
  };

  dados.push(novaMidia);
  await salvarDados(dados);

  console.log(`✅ "${titulo}" foi adicionado com sucesso!`);
}

// 📋 Listar mídias com formatação
async function listarMidias(dadosExternos = null) {
  const dados = dadosExternos || (await carregarDados());
  if (dados.length === 0) {
    console.log("⚠️ Nenhuma mídia cadastrada.");
    return;
  }

  console.log("\n📺 === LISTA DE MÍDIAS ===");
  dados.forEach((m) => {
    console.log(
      `\n🎬 ${m.titulo} (${m.ano}) - ${m.tipo.toUpperCase()}\n` +
        `   🎭 Gêneros: ${m.genero}\n` +
        `   📺 Plataforma: ${m.plataforma}\n` +
        (m.tipo === "série"
          ? `   📅 ${m.episodiosAssistidos}/${m.episodiosTotal} episódios assistidos | 🕒 ${m.duracaoMedia} min/ep`
          : `   🕒 Duração: ${m.duracaoMedia} min`) +
        `\n   ⭐ Nota: ${m.nota ?? "N/A"}`
    );
  });
  console.log("\n");
}

// 🧩 Atualizar informações
async function atualizarMidia() {
  const dados = await carregarDados();
  if (dados.length === 0) {
    console.log("⚠️ Nenhuma mídia cadastrada.");
    return;
  }

  const escolha = await inquirer.select({
    message: "Selecione a mídia para atualizar:",
    choices: dados.map((m) => ({ name: m.titulo, value: m.id })),
  });

  const midia = dados.find((m) => m.id === escolha);

  if (midia.tipo === "série") {
    midia.episodiosAssistidos = Number(
      await inquirer.input({ message: `Episódios assistidos (de ${midia.episodiosTotal}):` })
    );
  }

  const novaNota = Number(await inquirer.input({ message: "Oq você achou do filme ou serie? Dê uma nota (1 a 10, ou 0 para pular):" }));
  if (novaNota >= 1 && novaNota <= 10) {
    midia.nota = novaNota;
  }

  await salvarDados(dados);
  console.log("✅ Mídia atualizada com sucesso!");
}

// 🔍 Filtrar por gênero ou plataforma (melhorado)
async function filtrarMidias() {
  const dados = await carregarDados();
  if (dados.length === 0) return console.log("⚠️ Nenhuma mídia cadastrada.");

  const filtro = await inquirer.select({
    message: "Filtrar por:",
    choices: [
      { name: "🎭 Gênero", value: "genero" },
      { name: "📺 Plataforma", value: "plataforma" },
    ],
  });

  const valor = await inquirer.input({ message: `Digite o ${filtro} que deseja buscar:` });

  const filtrados = dados.filter((m) => {
    if (filtro === "genero") {
      const generos = m.genero
        .split(",")
        .map((g) => g.trim().toLowerCase());
      return generos.includes(valor.toLowerCase());
    } else {
      return m.plataforma.toLowerCase().includes(valor.toLowerCase());
    }
  });

  if (filtrados.length === 0) {
    console.log(`⚠️ Nenhuma mídia encontrada para "${valor}".`);
    return;
  }

  await listarMidias(filtrados);
}

// 🔎 Pesquisar por título
async function pesquisarMidia() {
  const dados = await carregarDados();
  if (dados.length === 0) return console.log("⚠️ Nenhuma mídia cadastrada.");

  const termo = await inquirer.input({ message: "Digite parte do título:" });
  const resultados = dados.filter((m) =>
    m.titulo.toLowerCase().includes(termo.toLowerCase())
  );

  if (resultados.length === 0) {
    console.log("❌ Nenhuma mídia encontrada com esse termo.");
    return;
  }

  await listarMidias(resultados);
}

// 🧾 Ordenar mídias
async function ordenarMidias() {
  const dados = await carregarDados();
  if (dados.length === 0) return console.log("⚠️ Nenhuma mídia cadastrada.");

  const criterio = await inquirer.select({
    message: "Ordenar por:",
    choices: [
      { name: "Título (A-Z)", value: "titulo" },
      { name: "Ano (mais recente primeiro)", value: "ano" },
      { name: "Nota (maior primeiro)", value: "nota" },
    ],
  });

  let ordenados;
  if (criterio === "titulo") ordenados = [...dados].sort((a, b) => a.titulo.localeCompare(b.titulo));
  if (criterio === "ano") ordenados = [...dados].sort((a, b) => b.ano - a.ano);
  if (criterio === "nota") ordenados = [...dados].sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0));

  await listarMidias(ordenados);
}

// 📊 Estatísticas detalhadas
async function verEstatisticas() {
  const dados = await carregarDados();
  if (dados.length === 0) return console.log("⚠️ Nenhuma mídia cadastrada.");

  const total = dados.length;
  const filmes = dados.filter((m) => m.tipo === "filme").length;
  const series = dados.filter((m) => m.tipo === "série").length;

  let totalMinutos = 0;
  let totalEpisodios = 0;

  for (const m of dados) {
    if (m.tipo === "filme") totalMinutos += m.duracaoMedia;
    else if (m.tipo === "série") {
      totalEpisodios += m.episodiosAssistidos;
      totalMinutos += m.episodiosAssistidos * m.duracaoMedia;
    }
  }

  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  console.log("\n📊 === ESTATÍSTICAS GERAIS ===");
  console.log(`🎬 Total de mídias: ${total}`);
  console.log(`📺 Séries: ${series} | 🎞️ Filmes: ${filmes}`);
  console.log(`🕒 Tempo total assistido: ${horas}h ${minutos}min`);
  console.log(`📡 Episódios vistos: ${totalEpisodios}\n`);
}

// 🏆 Ranking das melhores notas
async function verRanking() {
  const dados = await carregarDados();
  const avaliados = dados.filter((m) => m.nota !== null);

  if (avaliados.length === 0) {
    console.log("⚠️ Nenhuma mídia avaliada ainda.");
    return;
  }

  const ranking = [...avaliados].sort((a, b) => b.nota - a.nota);
  console.log("\n🏆 === RANKING DAS MELHORES NOTAS ===");
  ranking.forEach((m, i) => console.log(`${i + 1}. ${m.titulo} - ⭐ ${m.nota}`));
  console.log("\n");
}

// 🗑️ Deletar mídia
async function deletarMidia() {
  const dados = await carregarDados();
  if (dados.length === 0) return console.log("⚠️ Nenhuma mídia cadastrada.");

  const escolha = await inquirer.select({
    message: "Selecione a mídia para deletar:",
    choices: dados.map((m) => ({ name: m.titulo, value: m.id })),
  });

  const confirm = await inquirer.confirm({ message: "Tem certeza que deseja deletar?" });

  if (!confirm) {
    console.log("❎ Ação cancelada.");
    return;
  }

  const novosDados = dados.filter((m) => m.id !== escolha);
  await salvarDados(novosDados);
  console.log("🗑️ Mídia removida com sucesso!");
}

// 🚀 Iniciar o app
menu();
