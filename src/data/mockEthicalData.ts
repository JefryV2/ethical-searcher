
import { EntityData } from '@/types/entityTypes';

// Mock data to use as fallback when the API fails
export const mockEthicalData: EntityData[] = [
  {
    id: "1",
    name: "EcoTech Solutions",
    type: "company",
    description: "Sustainable technology firm focused on reducing carbon footprint through innovative solutions.",
    ethicalScore: 87,
    categories: ["Environmental", "Technology", "Renewable Energy"],
    certifications: ["B Corp Certified", "ISO 14001", "Carbon Trust Standard"],
    controversies: [
      {
        title: "Supply Chain Labor Concerns",
        description: "Reports of labor issues with a component supplier in Southeast Asia which were addressed within 3 months.",
        date: "2022-06-12",
        source_url: "https://www.sustainabilityreport.org/ecotech-supply-chain-2022"
      }
    ],
    website: "https://ecotechsolutions.com",
    ethical_analysis: "Strong environmental practices with regular carbon footprint reporting. Addressed supply chain issues promptly when discovered. Leading industry sustainability initiatives."
  },
  {
    id: "2",
    name: "Green Future Investments",
    type: "company",
    description: "Financial institution specializing in green investments and sustainable development funding.",
    ethicalScore: 92,
    categories: ["Finance", "Sustainability", "Investment"],
    certifications: ["Principles for Responsible Investment", "Global Impact Investing Rating", "Climate Bonds Standard"],
    controversies: [],
    website: "https://greenfutureinvest.com",
    ethical_analysis: "Transparent investment policies with rigorous environmental and social governance standards. Consistently avoids fossil fuel investments. Industry leader in sustainability reporting."
  },
  {
    id: "3",
    name: "Natural Wellness Co",
    type: "company",
    description: "Health and wellness product manufacturer using only organic and sustainably sourced ingredients.",
    ethicalScore: 84,
    categories: ["Health", "Consumer Goods", "Sustainability"],
    certifications: ["USDA Organic", "Fair Trade Certified", "Cruelty-Free"],
    controversies: [
      {
        title: "Packaging Criticism",
        description: "Environmental groups criticized plastic packaging, resulting in a full packaging redesign program.",
        date: "2021-11-04",
        source_url: "https://packagingnews.com/natural-wellness-redesign-2021"
      }
    ],
    website: "https://naturalwellness.com",
    ethical_analysis: "Strong ingredient sourcing practices but had packaging concerns that were subsequently addressed. New packaging goals exceed industry standards for sustainability."
  },
  {
    id: "4",
    name: "Maya Rodriguez",
    type: "creator",
    description: "Environmental activist and content creator focusing on sustainable lifestyle education.",
    ethicalScore: 93,
    categories: ["Education", "Lifestyle", "Environmental Activism"],
    certifications: ["Climate Reality Leadership Corps", "Environmental Educator Certification"],
    controversies: [],
    website: "https://mayarodriguez.earth",
    ethical_analysis: "Consistently transparent about partnerships and sponsorships. Only promotes products verified to meet strict environmental standards. Donates 15% of income to environmental causes.",
    disclosures: [
      {
        title: "Income Sources",
        description: "Maya discloses that 60% of her income comes from sponsored content, 25% from digital courses, and 15% from affiliate marketing.",
        link: "https://mayarodriguez.earth/transparency"
      },
      {
        title: "Content Review Policy",
        description: "All featured products must pass a 15-point sustainability checklist before being considered for promotion.",
        link: "https://mayarodriguez.earth/review-policy"
      }
    ],
    sponsorships: [
      {
        company: "EcoVital Products",
        details: "Recurring sponsorship for sustainable home goods content series",
        period: "2022-Present"
      },
      {
        company: "GreenTech Solutions",
        details: "One-time sponsored review of home solar installation process",
        period: "July 2023"
      }
    ],
    charitable_work: [
      {
        organization: "Ocean Cleanup Initiative",
        contribution: "Donated $25,000 and organized community cleanup events",
        year: "2023"
      },
      {
        organization: "Climate Education Fund",
        contribution: "Provided free workshops to 15 underserved schools",
        year: "2022-2023"
      }
    ]
  },
  {
    id: "5",
    name: "Ethical Consumer Media",
    type: "company",
    description: "Digital media platform providing ethical product reviews and corporate responsibility reporting.",
    ethicalScore: 90,
    categories: ["Media", "Consumer Advocacy", "Transparency"],
    certifications: ["Independent Press Standards", "Transparency in Publishing"],
    controversies: [],
    website: "https://ethicalconsumermedia.org",
    ethical_analysis: "Operates with full financial transparency and strict editorial independence policies. Refuses advertising from companies scoring below threshold on their own rating system."
  },
  {
    id: "6",
    name: "James Chen",
    type: "creator",
    description: "Tech influencer focused on sustainable technology and ethical electronics consumption.",
    ethicalScore: 89,
    categories: ["Technology", "Education", "Sustainability"],
    certifications: ["Sustainable Technology Advocate", "Digital Ethics Pledge"],
    controversies: [
      {
        title: "Undisclosed Partnership",
        description: "Failed to disclose partnership with tech company in 2021, subsequently apologized and implemented stricter disclosure policies.",
        date: "2021-08-15",
        source_url: "https://influencertransparency.org/case-studies/chen-2021"
      }
    ],
    website: "https://jameschen.tech",
    ethical_analysis: "Generally strong ethical practices with detailed transparency reports. Addressed disclosure issues promptly and has since maintained exemplary transparency standards.",
    disclosures: [
      {
        title: "Monthly Transparency Reports",
        description: "James publishes comprehensive reports detailing all sponsorships, gifted products, and affiliate earnings.",
        link: "https://jameschen.tech/transparency"
      },
      {
        title: "Review Methodology",
        description: "Detailed explanation of how products are tested and evaluated, with a focus on repairability and longevity.",
        link: "https://jameschen.tech/review-methodology"
      }
    ],
    sponsorships: [
      {
        company: "Fairphone",
        details: "Recurring sponsorship for sustainable tech content",
        period: "2022-Present"
      },
      {
        company: "Framework Laptop",
        details: "Sponsored content series on repairable technology",
        period: "2023"
      }
    ],
    charitable_work: [
      {
        organization: "Digital Divide Initiative",
        contribution: "Donated 150 refurbished computers to schools in underserved communities",
        year: "2022"
      },
      {
        organization: "E-Waste Recycling Program",
        contribution: "Organized collection events processing over 5 tons of electronic waste",
        year: "2023"
      }
    ]
  },
  {
    id: "7",
    name: "Circular Fashion House",
    type: "company",
    description: "Sustainable fashion brand operating on circular economy principles.",
    ethicalScore: 95,
    categories: ["Fashion", "Sustainability", "Circular Economy"],
    certifications: ["Global Organic Textile Standard", "Fair Wear Foundation", "Cradle to Cradle Certified"],
    controversies: [],
    website: "https://circularfashion.com",
    ethical_analysis: "Industry-leading circular business model with transparent supply chain reporting. All products designed for complete recyclability. Living wage certification across entire manufacturing network."
  },
  {
    id: "8",
    name: "Alex Murray",
    type: "creator",
    description: "Financial educator focusing on ethical investing and sustainable financial planning.",
    ethicalScore: 86,
    categories: ["Finance", "Education", "Investing"],
    certifications: ["Certified Financial Planner", "ESG Investment Advisor"],
    controversies: [],
    website: "https://ethicalfinancewithale.com",
    ethical_analysis: "Transparent about commission structures and income sources. Only recommends financial products meeting strict environmental and social criteria. Provides free educational content for underserved communities.",
    disclosures: [
      {
        title: "Revenue Structure",
        description: "Alex details that 40% of income comes from course sales, 30% from affiliate partnerships, 20% from consulting, and 10% from speaking engagements.",
        link: "https://ethicalfinancewithale.com/business-model"
      },
      {
        title: "Affiliate Disclosure",
        description: "Comprehensive list of all financial relationships with companies and products mentioned in content.",
        link: "https://ethicalfinancewithale.com/affiliates"
      }
    ],
    sponsorships: [
      {
        company: "Ethical Investment Fund",
        details: "Educational content series on ESG investing principles",
        period: "2022-2023"
      },
      {
        company: "Community Development Credit Union",
        details: "Sponsored workshops on financial literacy",
        period: "2023"
      }
    ],
    charitable_work: [
      {
        organization: "Financial Literacy Foundation",
        contribution: "Provides free financial education to 1,000+ individuals annually",
        year: "2021-Present"
      },
      {
        organization: "Community Investment Trust",
        contribution: "Volunteer financial advisor for neighborhood development projects",
        year: "2022-Present"
      }
    ]
  },
  {
    id: "9",
    name: "Clean Future Energy",
    type: "company",
    description: "Renewable energy provider specializing in solar and wind power solutions.",
    ethicalScore: 91,
    categories: ["Energy", "Utilities", "Sustainability"],
    certifications: ["Renewable Energy Standard", "Green-e Certified", "B Corp"],
    controversies: [
      {
        title: "Wind Farm Wildlife Impact",
        description: "Concerns about bird migration impacts at one wind farm location, addressed through redesigned turbines and wildlife monitoring program.",
        date: "2020-05-22",
        source_url: "https://renewableimpacts.org/clean-future-case-study"
      }
    ],
    website: "https://cleanfutureenergy.com",
    ethical_analysis: "Strong overall environmental practices with industry-leading emissions reporting. Addressed wildlife concerns with evidence-based solutions and ongoing monitoring."
  },
  {
    id: "10",
    name: "Community Harvest Co-op",
    type: "company",
    description: "Worker-owned food cooperative focusing on local, sustainable agriculture.",
    ethicalScore: 94,
    categories: ["Food", "Agriculture", "Cooperative Business"],
    certifications: ["Organic Certification", "Fair Labor Practices", "Local Food Alliance"],
    controversies: [],
    website: "https://communityharvestcoop.org",
    ethical_analysis: "Exemplary labor practices with profit-sharing model and democratic governance. Industry-leading waste reduction and local sourcing standards. Community education programs on sustainable food systems."
  }
];
