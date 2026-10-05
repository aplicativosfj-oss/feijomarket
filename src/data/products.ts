import whey from "@/assets/p-whey.jpg";
import supp from "@/assets/p-supp.jpg";
import clothes from "@/assets/p-clothes.jpg";
import shoes from "@/assets/p-shoes.jpg";
import audio from "@/assets/p-audio.jpg";
import tech from "@/assets/p-tech.jpg";
import home from "@/assets/p-home.jpg";
import beauty from "@/assets/p-beauty.jpg";
import sports from "@/assets/p-sports.jpg";
import papelaria from "@/assets/p-papelaria.jpg";
import leggings from "@/assets/p-leggings.jpg";
import intimas from "@/assets/p-intimas.jpg";
import impressao from "@/assets/p-impressao.jpg";
import topobolo from "@/assets/p-topobolo.jpg";
import type { Category, CategorySlug, Product, Review } from "./types";

const IMG = { whey, supp, clothes, shoes, audio, tech, home, beauty, sports, papelaria, leggings, intimas, impressao, topobolo };
type ImgKey = keyof typeof IMG;

export const CATEGORIES: Category[] = [
  { slug: "suplementos", name: "Suplementos", subcategories: ["Whey", "Creatina", "Vitaminas", "Pré-treino", "Termogênicos"], image: supp },
  { slug: "roupas", name: "Roupas", subcategories: ["Feminino", "Leggings", "Moda íntima", "Masculino", "Fitness"], image: clothes },
  { slug: "calcados", name: "Calçados", subcategories: ["Corrida", "Treino", "Casual"], image: shoes },
  { slug: "eletronicos", name: "Eletrônicos", subcategories: ["Fones", "Smartwatches", "Celulares", "Acessórios"], image: audio },
  { slug: "casa", name: "Casa", subcategories: ["Cozinha", "Decoração", "Organização"], image: home },
  { slug: "beleza-e-saude", name: "Beleza e Saúde", subcategories: ["Skincare", "Cabelo", "Bem-estar"], image: beauty },
  { slug: "esportes", name: "Esportes", subcategories: ["Musculação", "Yoga", "Outdoor"], image: sports },
  { slug: "papelaria", name: "Papelaria", subcategories: ["Cadernos", "Escrita", "Mochilas e estojos", "Organização", "Kits volta às aulas", "Topos de bolo", "Encadernação", "Impressão online"], image: papelaria },
];

const FLAVORS = { label: "Sabor", options: ["Chocolate", "Baunilha", "Morango", "Cookies"] };
const SIZES = ["P", "M", "G", "GG"];
const SHOE_SIZES = ["37", "38", "39", "40", "41", "42", "43"];

// [nome, categoria, sub, marca, preço, promo|0, imagem, estoque, nota, nº avaliações, tags]
type Row = [string, CategorySlug, string, string, number, number, ImgKey, number, number, number, Product["tags"]];

const ROWS: Row[] = [
  ["Whey Protein Isolado 900g", "suplementos", "Whey", "MaxForce", 249.9, 199.9, "whey", 42, 4.8, 1284, ["bestseller", "deal"]],
  ["Whey Protein Concentrado 1kg", "suplementos", "Whey", "Nutrion", 169.9, 0, "whey", 80, 4.6, 932, ["bestseller"]],
  ["Whey 3W Blend 2kg", "suplementos", "Whey", "IronLab", 289.9, 259.9, "whey", 15, 4.5, 411, []],
  ["Creatina Monohidratada 300g", "suplementos", "Creatina", "MaxForce", 129.9, 89.9, "supp", 120, 4.9, 2210, ["bestseller", "deal"]],
  ["Creatina Creapure 250g", "suplementos", "Creatina", "Nutrion", 159.9, 0, "supp", 34, 4.8, 640, ["new"]],
  ["Multivitamínico A-Z 120 caps", "suplementos", "Vitaminas", "VitaPlus", 79.9, 64.9, "supp", 200, 4.7, 518, []],
  ["Vitamina D3 2000UI 60 caps", "suplementos", "Vitaminas", "VitaPlus", 39.9, 0, "supp", 150, 4.8, 870, []],
  ["Ômega 3 1000mg 120 caps", "suplementos", "Vitaminas", "Nutrion", 69.9, 0, "supp", 0, 4.6, 302, []],
  ["Pré-treino Explosion 300g", "suplementos", "Pré-treino", "IronLab", 149.9, 119.9, "whey", 25, 4.4, 377, ["deal"]],
  ["Termogênico Burn Caps 60", "suplementos", "Termogênicos", "MaxForce", 99.9, 0, "supp", 60, 4.2, 210, ["new"]],
  ["Camiseta Dry Fit Masculina", "roupas", "Masculino", "Franc Wear", 89.9, 69.9, "clothes", 90, 4.6, 450, ["bestseller"]],
  ["Regata Performance Masculina", "roupas", "Masculino", "Pulse", 69.9, 0, "clothes", 45, 4.4, 128, []],
  ["Legging Compressão Feminina", "roupas", "Feminino", "Franc Wear", 149.9, 119.9, "clothes", 70, 4.8, 812, ["bestseller", "deal"]],
  ["Top Fitness Alta Sustentação", "roupas", "Feminino", "Pulse", 99.9, 0, "clothes", 38, 4.7, 333, ["new"]],
  ["Conjunto Fitness Seamless", "roupas", "Fitness", "Pulse", 219.9, 179.9, "clothes", 22, 4.6, 190, ["new"]],
  ["Shorts Treino 2 em 1", "roupas", "Fitness", "Franc Wear", 109.9, 0, "clothes", 55, 4.5, 221, []],
  ["Tênis Corrida Velocity", "calcados", "Corrida", "Stride", 499.9, 399.9, "shoes", 30, 4.8, 640, ["bestseller", "deal"]],
  ["Tênis Corrida Cloud Run", "calcados", "Corrida", "AeroStep", 649.9, 0, "shoes", 12, 4.7, 288, ["new"]],
  ["Tênis Treino Cross Grip", "calcados", "Treino", "Stride", 389.9, 349.9, "shoes", 40, 4.6, 302, []],
  ["Tênis Casual Urban", "calcados", "Casual", "AeroStep", 299.9, 0, "shoes", 65, 4.4, 154, []],
  ["Chinelo Slide Recovery", "calcados", "Casual", "Stride", 129.9, 99.9, "shoes", 100, 4.5, 410, ["deal"]],
  ["Fone Bluetooth ANC Pro", "eletronicos", "Fones", "Sonix", 899.9, 699.9, "audio", 18, 4.8, 940, ["bestseller", "deal"]],
  ["Fone Esportivo TWS Sport", "eletronicos", "Fones", "Sonix", 349.9, 0, "audio", 60, 4.5, 612, ["bestseller"]],
  ["Headphone Studio Wireless", "eletronicos", "Fones", "Volta", 1199.9, 0, "audio", 9, 4.7, 205, ["new"]],
  ["Smartwatch Fit GPS", "eletronicos", "Smartwatches", "Pulsar", 1299.9, 1049.9, "tech", 25, 4.6, 488, ["deal"]],
  ["Smartwatch Active Lite", "eletronicos", "Smartwatches", "Pulsar", 499.9, 0, "tech", 70, 4.3, 360, []],
  ["Smartphone Nova X 256GB", "eletronicos", "Celulares", "Nova", 3499.9, 2999.9, "tech", 14, 4.7, 721, ["bestseller"]],
  ["Smartphone Nova Lite 128GB", "eletronicos", "Celulares", "Nova", 1799.9, 0, "tech", 33, 4.4, 298, ["new"]],
  ["Carregador Turbo 65W USB-C", "eletronicos", "Acessórios", "Volta", 179.9, 139.9, "tech", 140, 4.6, 520, []],
  ["Garrafa Térmica Inox 750ml", "casa", "Cozinha", "Hōme", 129.9, 99.9, "home", 85, 4.8, 670, ["bestseller", "deal"]],
  ["Caneca Cerâmica Artesanal", "casa", "Cozinha", "Hōme", 59.9, 0, "home", 50, 4.6, 140, []],
  ["Difusor de Aromas Bambu", "casa", "Decoração", "Hōme", 89.9, 0, "home", 40, 4.5, 112, ["new"]],
  ["Kit Potes Herméticos 6 pçs", "casa", "Organização", "Casa Viva", 149.9, 119.9, "home", 0, 4.4, 230, []],
  ["Sérum Vitamina C 30ml", "beleza-e-saude", "Skincare", "Derma Pure", 119.9, 89.9, "beauty", 75, 4.7, 890, ["bestseller", "deal"]],
  ["Hidratante Facial FPS 30", "beleza-e-saude", "Skincare", "Derma Pure", 79.9, 0, "beauty", 95, 4.6, 410, []],
  ["Shampoo Fortalecedor 300ml", "beleza-e-saude", "Cabelo", "Natura Lab", 49.9, 0, "beauty", 110, 4.4, 198, ["new"]],
  ["Óleo de Massagem Relax", "beleza-e-saude", "Bem-estar", "Natura Lab", 69.9, 59.9, "beauty", 44, 4.5, 156, []],
  ["Kit Halteres Emborrachados 2x5kg", "esportes", "Musculação", "IronFit", 219.9, 189.9, "sports", 28, 4.7, 340, ["bestseller"]],
  ["Tapete Yoga Antiderrapante", "esportes", "Yoga", "Zen Move", 139.9, 0, "sports", 60, 4.6, 402, []],
  ["Corda de Pular Rolamento", "esportes", "Musculação", "IronFit", 49.9, 39.9, "sports", 150, 4.5, 288, ["deal"]],
  ["Faixas Elásticas Kit 5", "esportes", "Musculação", "Zen Move", 79.9, 0, "sports", 90, 4.6, 310, ["new"]],
  ["Mochila Trilha 30L", "esportes", "Outdoor", "Outpeak", 279.9, 229.9, "sports", 20, 4.7, 176, []],
  ["Caderno Universitário 10 Matérias 200fls", "papelaria", "Cadernos", "Caderno Co.", 49.9, 39.9, "papelaria", 300, 4.8, 1520, ["bestseller", "deal"]],
  ["Caderno Inteligente Discos A5", "papelaria", "Cadernos", "Smart Note", 119.9, 0, "papelaria", 80, 4.9, 870, ["bestseller", "new"]],
  ["Caderno Pontilhado Capa Dura A5", "papelaria", "Cadernos", "Franc Paper", 54.9, 0, "papelaria", 120, 4.7, 312, ["new"]],
  ["Planner 2027 Semanal Capa Dura", "papelaria", "Organização", "Franc Paper", 79.9, 64.9, "papelaria", 150, 4.8, 640, ["new", "deal"]],
  ["Agenda Escolar 2027", "papelaria", "Organização", "Caderno Co.", 39.9, 0, "papelaria", 200, 4.6, 410, ["new"]],
  ["Kit Canetas Gel 0.7 com 12 cores", "papelaria", "Escrita", "Linea", 44.9, 34.9, "papelaria", 250, 4.7, 980, ["bestseller"]],
  ["Marca-texto Pastel 6 unidades", "papelaria", "Escrita", "Tinta Viva", 32.9, 0, "papelaria", 180, 4.8, 760, []],
  ["Lapiseira 0.5 + Grafites + Borracha", "papelaria", "Escrita", "Linea", 29.9, 24.9, "papelaria", 220, 4.6, 520, []],
  ["Estojo Box 3 Divisórias", "papelaria", "Mochilas e estojos", "Franc Paper", 59.9, 0, "papelaria", 90, 4.5, 280, []],
  ["Mochila Escolar Notebook 15,6\"", "papelaria", "Mochilas e estojos", "Outpeak", 199.9, 169.9, "papelaria", 60, 4.7, 430, ["deal"]],
  ["Fichário Universitário 4 Argolas", "papelaria", "Organização", "Caderno Co.", 89.9, 0, "papelaria", 70, 4.6, 215, []],
  ["Kit Volta às Aulas 2027 Fundamental", "papelaria", "Kits volta às aulas", "Franc Paper", 189.9, 149.9, "papelaria", 100, 4.8, 340, ["new", "deal"]],
  ["Kit Volta às Aulas 2027 Universitário", "papelaria", "Kits volta às aulas", "Franc Paper", 249.9, 199.9, "papelaria", 80, 4.9, 210, ["new", "bestseller"]],
  // Roupas femininas
  ["Legging Cintura Alta Básica", "roupas", "Leggings", "Franc Wear", 79.9, 64.9, "leggings", 150, 4.7, 1120, ["bestseller", "deal"]],
  ["Legging Empina Bumbum (Scrunch)", "roupas", "Leggings", "Pulse", 119.9, 99.9, "leggings", 90, 4.8, 980, ["bestseller"]],
  ["Legging Flare Cintura Alta", "roupas", "Leggings", "Bella Fit", 129.9, 0, "leggings", 70, 4.6, 410, ["new"]],
  ["Legging Estampada Floral", "roupas", "Leggings", "Bella Fit", 99.9, 0, "leggings", 60, 4.5, 260, ["new"]],
  ["Legging Térmica Peluciada", "roupas", "Leggings", "Franc Wear", 139.9, 109.9, "leggings", 45, 4.7, 330, ["deal"]],
  ["Legging com Bolso Lateral", "roupas", "Leggings", "Pulse", 109.9, 0, "leggings", 80, 4.8, 540, []],
  ["Legging Cirré Efeito Couro", "roupas", "Leggings", "Bella Fit", 149.9, 0, "leggings", 35, 4.6, 190, ["new"]],
  ["Bermuda Biker Feminina", "roupas", "Feminino", "Pulse", 69.9, 59.9, "leggings", 100, 4.6, 380, []],
  ["Macaquinho Fitness Feminino", "roupas", "Feminino", "Bella Fit", 159.9, 0, "clothes", 40, 4.7, 220, ["new"]],
  ["Cropped Canelado Feminino", "roupas", "Feminino", "Franc Wear", 49.9, 0, "clothes", 120, 4.5, 310, []],
  ["Vestido Midi Canelado", "roupas", "Feminino", "Bella Fit", 139.9, 119.9, "clothes", 30, 4.6, 150, ["deal"]],
  ["Kit 5 Calcinhas Algodão", "roupas", "Moda íntima", "Íntima Co.", 69.9, 54.9, "intimas", 200, 4.7, 1340, ["bestseller", "deal"]],
  ["Kit 3 Calcinhas Sem Costura", "roupas", "Moda íntima", "Íntima Co.", 59.9, 0, "intimas", 150, 4.8, 870, ["bestseller"]],
  ["Sutiã Sem Aro Conforto", "roupas", "Moda íntima", "Íntima Co.", 79.9, 0, "intimas", 90, 4.6, 520, []],
  ["Sutiã com Bojo Liso", "roupas", "Moda íntima", "Bella Fit", 89.9, 74.9, "intimas", 70, 4.5, 410, []],
  ["Conjunto Renda Delicada", "roupas", "Moda íntima", "Bella Fit", 119.9, 0, "intimas", 40, 4.7, 260, ["new"]],
  ["Body Modelador Feminino", "roupas", "Moda íntima", "Íntima Co.", 129.9, 109.9, "intimas", 35, 4.6, 180, ["new"]],
  ["Pijama Feminino Algodão", "roupas", "Moda íntima", "Íntima Co.", 99.9, 0, "intimas", 60, 4.8, 290, []],
  ["Kit 3 Meias Soquete", "roupas", "Moda íntima", "Franc Wear", 29.9, 0, "intimas", 300, 4.5, 640, []],
  // Papelaria: personalizados e serviços
  ["Topo de Bolo Personalizado (Tema à escolha)", "papelaria", "Topos de bolo", "Franc Festas", 34.9, 29.9, "topobolo", 999, 4.9, 760, ["bestseller", "deal"]],
  ["Topo de Bolo 3D Camadas", "papelaria", "Topos de bolo", "Franc Festas", 54.9, 0, "topobolo", 999, 4.8, 320, ["new"]],
  ["Topo de Bolo Acrílico Espelhado com Nome", "papelaria", "Topos de bolo", "Franc Festas", 69.9, 0, "topobolo", 999, 4.9, 210, ["new"]],
  ["Kit Festa Personalizado (topo + 20 toppers)", "papelaria", "Topos de bolo", "Franc Festas", 89.9, 74.9, "topobolo", 999, 4.8, 180, []],
  ["Encadernação Espiral até 100 folhas", "papelaria", "Encadernação", "Franc Print", 9.9, 0, "impressao", 999, 4.8, 640, ["bestseller"]],
  ["Encadernação Espiral até 300 folhas", "papelaria", "Encadernação", "Franc Print", 14.9, 0, "impressao", 999, 4.8, 310, []],
  ["Encadernação Wire-o Premium", "papelaria", "Encadernação", "Franc Print", 19.9, 0, "impressao", 999, 4.9, 150, ["new"]],
  ["Encadernação Capa Dura (TCC)", "papelaria", "Encadernação", "Franc Print", 49.9, 44.9, "impressao", 999, 4.9, 220, ["deal"]],
  ["Impressão Online P&B (por página)", "papelaria", "Impressão online", "Franc Print", 0.3, 0, "impressao", 99999, 4.7, 1980, ["bestseller"]],
  ["Impressão Online Colorida (por página)", "papelaria", "Impressão online", "Franc Print", 1.2, 0, "impressao", 99999, 4.7, 1240, []],
  ["Impressão de Apostila Completa (até 100 págs)", "papelaria", "Impressão online", "Franc Print", 29.9, 24.9, "impressao", 999, 4.8, 410, ["new", "deal"]],
  ["Plastificação A4", "papelaria", "Impressão online", "Franc Print", 4.9, 0, "impressao", 999, 4.6, 190, []],
];

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const NAMES = ["Ana P.", "Bruno S.", "Carla M.", "Diego R.", "Eduarda L.", "Felipe T."];
const TEXTS = [
  "Produto excelente, chegou antes do prazo e bem embalado.",
  "Ótimo custo-benefício, recomendo demais!",
  "Qualidade acima do esperado. Comprarei novamente.",
  "Bom produto, atendeu o que prometia.",
];

function reviewsFor(i: number, rating: number): Review[] {
  return [0, 1, 2].map((k) => ({
    author: NAMES[(i + k) % NAMES.length],
    rating: Math.max(3, Math.min(5, Math.round(rating - (k === 2 ? 1 : 0)))),
    date: `2026-0${((i + k) % 8) + 1}-1${k}`,
    text: TEXTS[(i + k) % TEXTS.length],
  }));
}

const SERVICE_NOTES: Record<string, string> = {
  "Topos de bolo": "Personalizado com o nome, a idade e o tema que você escolher. Após a compra, envie os dados e fotos pelo WhatsApp; a arte é aprovada por você antes da produção. Prazo de produção: 2 a 4 dias úteis.",
  "Encadernação": "Envie seu arquivo em PDF pelo WhatsApp ou e-mail após a compra. Imprimimos (se necessário) e encadernamos com acabamento profissional. Prazo: 1 a 2 dias úteis + frete ou retirada.",
  "Impressão online": "Xerox online: compre a quantidade de páginas desejada e envie seu arquivo em PDF pelo WhatsApp ou e-mail. Conferimos o arquivo antes de imprimir. Prazo: 1 dia útil + frete ou retirada.",
};

function variantsFor(cat: CategorySlug, sub: string) {
  if (cat === "suplementos" && ["Whey", "Pré-treino"].includes(sub)) return { variants: [FLAVORS] };
  if (sub === "Topos de bolo") return { variants: [{ label: "Tema", options: ["Aniversário", "Infantil", "Futebol", "Princesas", "Chá revelação", "Casamento"] }] };
  if (sub === "Encadernação") return { variants: [{ label: "Capa", options: ["Transparente", "Preta", "Personalizada"] }] };
  if (sub === "Impressão online") return { variants: [{ label: "Papel", options: ["Sulfite 75g", "Sulfite 90g", "Couché 150g"] }, { label: "Lados", options: ["Frente", "Frente e verso"] }] };
  if (sub === "Moda íntima") return { variants: [{ label: "Tamanho", options: SIZES }, { label: "Cor", options: ["Preto", "Nude", "Branco", "Mescla"] }], sizes: SIZES, colors: ["Preto", "Nude", "Branco", "Mescla"] };
  if (sub === "Leggings") return { variants: [{ label: "Tamanho", options: SIZES }, { label: "Cor", options: ["Preto", "Grafite", "Verde", "Nude"] }], sizes: SIZES, colors: ["Preto", "Grafite", "Verde", "Nude"] };
  if (cat === "roupas") return { variants: [{ label: "Tamanho", options: SIZES }, { label: "Cor", options: ["Preto", "Grafite", "Verde"] }], sizes: SIZES, colors: ["Preto", "Grafite", "Verde"] };
  if (cat === "calcados") return { variants: [{ label: "Tamanho", options: SHOE_SIZES }, { label: "Cor", options: ["Preto/Verde", "Preto"] }], sizes: SHOE_SIZES, colors: ["Preto"] };
  if (cat === "eletronicos") return { variants: [{ label: "Cor", options: ["Preto", "Grafite"] }], colors: ["Preto", "Grafite"] };
  return { variants: [] };
}

export const PRODUCTS: Product[] = ROWS.map(([name, category, subcategory, brand, price, sale, img, stock, rating, reviewCount, tags], i) => {
  const v = variantsFor(category, subcategory);
  const others = (Object.keys(IMG) as ImgKey[]).filter((k) => k !== img);
  return {
    id: `p${String(i + 1).padStart(3, "0")}`,
    slug: slugify(name),
    name,
    brand,
    category,
    subcategory,
    description: SERVICE_NOTES[subcategory] ? `${name}. ${SERVICE_NOTES[subcategory]}` : `${name} da ${brand}: desenvolvido para quem busca qualidade e desempenho no dia a dia. Materiais selecionados, acabamento premium e garantia de procedência. Ideal para ${subcategory.toLowerCase()} e para elevar sua rotina.`,
    price,
    salePrice: sale || undefined,
    stock,
    rating,
    reviewCount,
    images: [IMG[img], IMG[img], IMG[others[i % others.length]]],
    ...v,
    specs: {
      Marca: brand,
      Categoria: subcategory,
      "Código": `FS-${1000 + i}`,
      Garantia: category === "eletronicos" ? "12 meses" : "90 dias",
      Origem: SERVICE_NOTES[subcategory] ? "Serviço sob encomenda" : "Nacional",
    },
    tags,
    reviews: reviewsFor(i, rating),
    source: "own",
  };
});

export const BRANDS = Array.from(new Set(PRODUCTS.map((p) => p.brand))).sort();
