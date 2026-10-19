import type { ExperimentIconKey } from "@/components/student/experimentIcons";

export type ExperimentSection =
  | {
      type: "predict";
      title: string;
      question: string;
      options: { id: string; label: string }[];
    }
  | {
      type: "experiment";
      title: string;
      content?: string;
      /** Path served by /html/[[...path]] route */
      embedUrl?: string;
    }
  | {
      type: "qa";
      title: string;
      questions: string[];
    }
  | {
      type: "image";
      title: string;
      /** Key mapped to a static asset in ExperimentDetail */
      imageKey: string;
      alt?: string;
      questions?: string[];
    }
  | {
      type: "conclusion";
      title: string;
      statements: string[];
    };

export interface Experiment {
  slug: string;
  title: string;
  description: string;
  iconBg: string;
  icon: ExperimentIconKey;
  sections: ExperimentSection[];
}

export const EXPERIMENTS: Experiment[] = [
  {
    slug: "truyen-thang-anh-sang",
    title: "Truyền thẳng ánh sáng",
    description: "Tìm hiểu đường đi của ánh sáng trong môi trường đồng tính",
    iconBg: "bg-sky-100 text-sky-600",
    icon: "straight",
    sections: [
      {
        type: "predict",
        title: "1. Dự đoán",
        question:
          "Đặt một tấm bìa ở giữa nguồn sáng và màn, khi mở rộng vùng phát sáng, bóng của tấm bìa trên màn thay đổi như thế nào?",
        options: [],
      },
      {
        type: "experiment",
        title: "2. Thí nghiệm",
        embedUrl: "/html/truyen-thang-anh-sang/vung-toi-nua-toi.html",
      },
      {
        type: "qa",
        title: "3. Phân tích kết quả",
        questions: [
          "Khi chuyển từ nguồn sáng hẹp sang nguồn sáng rộng, vùng nào xuất hiện rõ hơn ở trên màn?",
          "Nếu tiếp tục mở rộng nguồn nhưng giữ nguyên các khoảng cách, bóng tối và bóng nửa tối thay đổi như thế nào?",
        ],
      },
      {
        type: "conclusion",
        title: "4. Kết luận",
        statements: [
          "Trong môi trường trong suốt và đồng tính, ánh sáng truyền đi theo [đường thẳng].",
          "Bóng tối: Là vùng nằm ở phía [sau] vật cản sáng, hoàn toàn [không nhận được] ánh sáng từ nguồn sáng truyền tới.",
          "Bóng nửa tối: Là vùng nằm ở phía [sau] vật cản sáng, chỉ [nhận được] một phần ánh sáng từ nguồn sáng truyền tới.",
        ],
      },
      {
        type: "qa",
        title: "5. Câu hỏi nâng cao",
        questions: [
          "Vì sao bóng của bàn tay dưới một đèn có mặt phát sáng lớn thường có mép mờ hơn dưới một nguồn sáng rất nhỏ?",
        ],
      },
    ],
  },
  {
    slug: "phan-xa-anh-sang",
    title: "Phản xạ ánh sáng",
    description: "Tìm hiểu hiện tượng phản xạ ánh sáng trên gương phẳng",
    iconBg: "bg-emerald-100 text-emerald-600",
    icon: "reflect",
    sections: [
      {
        type: "predict",
        title: "1. Dự đoán",
        question:
          "Khi ánh sáng chiếu vào một bề mặt nhẵn bóng như gương phẳng sẽ xảy ra hiện tượng gì?",
        options: [],
      },
      {
        type: "experiment",
        title: "2. Thí nghiệm",
        embedUrl: "/html/phan-xa-anh-sang/phan-xa.html",
      },
      {
        type: "qa",
        title: "3. Phân tích kết quả",
        questions: [
          "Nhận xét mối liên hệ giữa góc tới và góc phản xạ.",
          "Khi thay đổi hướng của tia tới, tia phản xạ có thay đổi không?",
          "Khi chiếu ánh sáng tới vuông góc với gương phẳng thì ánh sáng đi như thế nào?",
        ],
      },
      {
        type: "conclusion",
        title: "4. Kết luận",
        statements: [
          "Hiện tượng phản xạ ánh sáng là hiện tượng khi chiếu ánh sáng vào gương thì chùm sáng bị [hắt trở lại] theo hướng khác.",
          "Tia phản xạ nằm trong mặt phẳng chứa tia tới và [đường pháp tuyến].",
          "Góc phản xạ [bằng] góc tới: i′ [=] i.",
        ],
      },
      {
        type: "qa",
        title: "5. Câu hỏi nâng cao",
        questions: [
          "Giữ nguyên vị trí tia tới, quay gương một góc 20° quanh điểm tới O. Hỏi tia phản xạ sẽ quay một góc bao nhiêu? Giải thích.",
        ],
      },
    ],
  },
  {
    slug: "khuc-xa-anh-sang",
    title: "Khúc xạ ánh sáng",
    description: "Tìm hiểu hiện tượng khúc xạ ánh sáng và phản xạ toàn phần",
    iconBg: "bg-blue-100 text-blue-600",
    icon: "refract",
    sections: [
      {
        type: "predict",
        title: "1. Dự đoán",
        question:
          "Khi ánh sáng chiếu từ không khí vào nước thì truyền đi như thế nào?",
        options: [],
      },
      {
        type: "experiment",
        title: "2. Thí nghiệm",
        embedUrl: "/html/khuc-xa-anh-sang/khuc-xa.html",
      },
      {
        type: "qa",
        title: "3. Phân tích kết quả",
        questions: [
          "Khi góc tới tăng thì góc khúc xạ thay đổi như thế nào?",
          "Khi ánh sáng truyền từ không khí vào nước, tia khúc xạ bị lệch gần hay xa pháp tuyến hơn?",
          "Khi nào thì xuất hiện hiện tượng phản xạ toàn phần?",
        ],
      },
      {
        type: "conclusion",
        title: "4. Kết luận",
        statements: [
          "Tia khúc xạ nằm trong mặt phẳng tới và ở phía [bên kia] pháp tuyến so với tia tới.",
          "Với hai môi trường trong suốt nhất định, tỉ số giữa sin của góc tới (sin i) và sin của góc khúc xạ (sin r) [luôn không đổi].",
          `<p><strong>Điều kiện xuất hiện hiện tượng phản xạ ánh sáng toàn phần</strong></p>
<ul>
<li>Ánh sáng truyền từ môi trường chiết quang hơn sang môi trường chiết quang kém (tức là có chiết suất [lớn] sang chiết suất [nhỏ hơn], n<sub>1</sub> [>] n<sub>2</sub>).</li>
<li>Góc tới [lớn hơn] hoặc [bằng] góc giới hạn phản xạ toàn phần, trong đó góc giới hạn được tính theo công thức:
<math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>sin</mi><msub><mi>i</mi><mrow><mi>g</mi><mi>h</mi></mrow></msub><mo>=</mo><mfrac><msub><mi>n</mi><mn>2</mn></msub><msub><mi>n</mi><mn>1</mn></msub></mfrac></mrow><annotation encoding="text/plain">sin i_gh = n2/n1</annotation></semantics></math>
</li>
</ul>`,
        ],
      },
      {
        type: "qa",
        title: "5. Câu hỏi nâng cao",
        questions: [
          "Để bắt một con cá trong nước, người ta phải phóng mũi lao đến vị trí như thế nào so với vị trí mà mắt thấy cá? Giải thích vì sao?",
        ],
      },
    ],
  },
  {
    slug: "lang-kinh-tan-sac",
    title: "Lăng kính – Tán sắc ánh sáng",
    description:
      "Tìm hiểu đường đi tia sáng qua lăng kính và hiện tượng tán sắc",
    iconBg: "bg-violet-100 text-violet-600",
    icon: "prism",
    sections: [
      {
        type: "predict",
        title: "1. Dự đoán",
        question:
          "Quan sát hình dạng của lăng kính và đường đi dự kiến của tia sáng laser từ không khí vào lăng kính. Chiếu chùm ánh sáng trắng (ánh sáng từ đèn sợi đốt) đến lăng kính thì xảy ra hiện tượng gì?",
        options: [],
      },
      {
        type: "experiment",
        title: "2. Thí nghiệm",
        embedUrl: "/html/lang-kinh/tan-sac.html",
      },
      {
        type: "qa",
        title: "3. Phân tích kết quả",
        questions: [
          "Quan sát hình dạng của lăng kính và đường đi dự kiến của tia sáng laser.",
          "Khi ánh sáng truyền từ không khí vào nước, tia sáng có bị đổi hướng không? Tia ló ra ngoài không khí lệch về phía nào?",
          "Khi chiếu ánh sáng trắng vào lăng kính, trên màn quan sát xuất hiện những màu gì? Các tia sáng màu này có bị lệch giống nhau không?",
        ],
      },
      {
        type: "conclusion",
        title: "4. Kết luận",
        statements: [
          "Lăng kính là một khối chất [trong suốt], đồng chất (thuỷ tinh, nhựa…), thường có dạng lăng trụ tam giác.",
          "Ánh sáng truyền qua lăng kính bị [khúc xạ], tia ló bị lệch về phía [đáy] lăng kính.",
          "Ánh sáng trắng khi qua lăng kính bị [phân tách] thành dải màu liên tục từ [đỏ] đến [tím], gọi là hiện tượng tán sắc ánh sáng.",
          "Các ánh sáng màu khác nhau bị lệch khác nhau; ánh sáng đỏ lệch [ít] nhất, ánh sáng tím lệch [nhiều] nhất.",
        ],
      },
      {
        type: "qa",
        title: "5. Câu hỏi nâng cao",
        questions: [
          "Tính góc lệch D giữa tia ló và tia tới?",
          "Hãy giải thích vai trò của các giọt nước trong không khí trong việc tạo ra dải màu cầu vồng?",
        ],
      },
    ],
  },
  {
    slug: "thau-kinh-hoi-tu",
    title: "Thấu kính hội tụ",
    description: "Tìm hiểu ảnh tạo bởi thấu kính hội tụ và công thức thấu kính",
    iconBg: "bg-indigo-100 text-indigo-600",
    icon: "lens",
    sections: [
      {
        type: "predict",
        title: "1. Dự đoán",
        question:
          "Đặt một vật sáng trước thấu kính hội tụ. Khi thay đổi vị trí của vật so với thấu kính thì ảnh tạo bởi thấu kính có thay đổi không?",
        options: [],
      },
      {
        type: "experiment",
        title: "2. Thí nghiệm",
        embedUrl: "/html/thau-kinh/thau-kinh-hoi-tu.html",
      },
      {
        type: "image",
        title: "3. Phân tích kết quả",
        imageKey: "ket_qua_thau_kinh_hoi_tu",
        alt: "Bảng phân tích kết quả ảnh qua thấu kính hội tụ",
        questions: [
          "Nêu kết luận về ảnh của một vật tạo bởi thấu kính hội tụ khi đặt vật ở trong và ngoài tiêu cự.",
          "Từ mô phỏng trên, hãy xây dựng công thức liên hệ giữa d, d′ và f với trường hợp tạo ảnh thật.",
        ],
      },
      {
        type: "conclusion",
        title: "4. Kết luận",
        statements: [
          "Thấu kính hội tụ có thể tạo [ảnh thật] hoặc [ảnh ảo] tùy vị trí đặt vật.",
          "Khi vật đặt ngoài tiêu cự: ảnh [thật], [ngược] chiều vật; có thể [lớn hơn], [nhỏ hơn] hoặc [bằng] vật.",
          "Khi vật đặt trong tiêu cự: ảnh [ảo], [cùng] chiều và [lớn hơn] vật.",
          "Công thức thấu kính: 1/d + 1/d′ = 1/f.",
        ],
      },
      {
        type: "qa",
        title: "5. Câu hỏi nâng cao",
        questions: [
          "Công thức trên còn đúng với trường hợp thấu kính hội tụ tạo ảnh ảo và với trường hợp thấu kính phân kì không? Điều kiện để áp dụng công thức trên là gì?",
          "Một vật sáng đặt trước thấu kính hội tụ cho ảnh thật cao gấp 3 lần vật. Nếu dịch chuyển vật lại gần thấu kính nhưng vẫn ngoài tiêu điểm, kích thước ảnh thay đổi như thế nào? Giải thích.",
        ],
      },
    ],
  },
  {
    slug: "thau-kinh-phan-ki",
    title: "Thấu kính phân kì",
    description:
      "Tìm hiểu ảnh tạo bởi thấu kính phân kì và công thức thấu kính",
    iconBg: "bg-indigo-100 text-indigo-600",
    icon: "lens",
    sections: [
      {
        type: "predict",
        title: "1. Dự đoán",
        question:
          "Đặt một vật sáng trước thấu kính phân kì. Khi thay đổi vị trí của vật so với thấu kính thì ảnh tạo bởi thấu kính có thay đổi không?",
        options: [],
      },
      {
        type: "experiment",
        title: "2. Thí nghiệm",
        embedUrl: "/html/thau-kinh/thau-kinh-phan-ky.html",
      },
      {
        type: "qa",
        title: "3. Phân tích kết quả",
        questions: [
          "Quan sát đường truyền của các tia sáng qua thấu kính phân kì. Em nhận xét gì về hướng đi của tia ló?",
          "Khi đặt một vật sáng trước thấu kính phân kì, có thể hứng được ảnh trên màn không? Vì sao?",
          "Nêu đặc điểm của ảnh của một vật tạo bởi thấu kính phân kì.",
        ],
      },
      {
        type: "conclusion",
        title: "4. Kết luận",
        statements: [
          "Thấu kính phân kì luôn cho ảnh [ảo], [cùng] chiều, [nhỏ hơn] vật và luôn nằm [trong] khoảng tiêu cự của thấu kính.",
          "Công thức thấu kính: 1/d + 1/d′ = 1/f với d′ < 0, f < 0.",
        ],
      },
      {
        type: "qa",
        title: "5. Câu hỏi nâng cao",
        questions: [
          "Một học sinh nhìn một vật nhỏ qua thấu kính phân kì và thấy ảnh của vật nhỏ hơn vật. Nếu tăng khoảng cách từ vật đến thấu kính thì ảnh có thay đổi kích thước không? Giải thích.",
          "Vì sao kính cận thị thường sử dụng thấu kính phân kì? Hãy giải thích dựa trên đặc điểm tạo ảnh của thấu kính.",
        ],
      },
    ],
  },
];

export function getExperiment(slug: string) {
  return EXPERIMENTS.find((e) => e.slug === slug) ?? null;
}
