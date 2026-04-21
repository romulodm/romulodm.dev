"use client";

import { useEffect, useMemo, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type SupportedChar = "D" | "L" | "M" | "O" | "R" | "U" | " ";

interface BezierPoint {
  x: number; y: number;
  h0x: number; h0y: number;
  h1x: number; h1y: number;
}

type GlyphSegment = BezierPoint[];
type GlyphData = GlyphSegment[] | null;
type CharacterSet = Partial<Record<SupportedChar, GlyphData>>;

interface LetterTuning { offY: number; bzIn: number; bzOut: number; idOut: number; }
interface LetterShape { width: number; segments: GlyphSegment[]; tuning: LetterTuning; }

export interface IgaratipoSignatureProps {
  strokeColor?: string;
  backgroundColor?: string;
  thickness?: number;
  noiseScale?: number;
  flowSpeed?: number;
  width?: number;
  height?: number;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LETTER DATA
// ─────────────────────────────────────────────────────────────────────────────

const LETTER_TUNING: Array<Partial<Record<SupportedChar, LetterTuning>>> = [
  {
    D: { offY: 0, bzIn: 1, bzOut: 1, idOut: 1 },
    L: { offY: 0, bzIn: 1, bzOut: 1, idOut: 0 },
    M: { offY: -0.2, bzIn: 1, bzOut: 1, idOut: 0 },
    O: { offY: 0, bzIn: 1, bzOut: 1, idOut: 0 },
    R: { offY: 0.1, bzIn: 1, bzOut: 1, idOut: 0 },
    U: { offY: 0, bzIn: 1, bzOut: 1, idOut: 0 },
  },
  {
    D: { offY: 0, bzIn: 1, bzOut: 1, idOut: 0 },
    L: { offY: 0, bzIn: 1, bzOut: 1, idOut: 0 },
    M: { offY: 0, bzIn: 1, bzOut: 1, idOut: 0 },
    O: { offY: 0, bzIn: 1, bzOut: 1, idOut: 1 },
    R: { offY: 0, bzIn: 1, bzOut: 1, idOut: 0 },
    U: { offY: 0, bzIn: 1, bzOut: 1, idOut: 0 },
  },
  {
    M: { offY: 0, bzIn: 1, bzOut: 1, idOut: 0 },
    R: { offY: 0, bzIn: 1, bzOut: 1, idOut: 0 },
    U: { offY: 0, bzIn: 1, bzOut: 1, idOut: 0 },
  },
];

const SET0_O: GlyphData = [
  [
    { x: 782.9, y: 539.1, h0x: 782.9, h0y: 539.1, h1x: 804.3, h1y: 531.7 },
    { x: 841.6, y: 542.4, h0x: 827.9, h0y: 532.9, h1x: 855.3, h1y: 551.9 },
    { x: 867.3, y: 571.6, h0x: 863.2, h0y: 560.2, h1x: 871.9, h1y: 584.3 },
    { x: 908.6, y: 605.4, h0x: 882.1, h0y: 600.4, h1x: 938.8, h1y: 611 },
    { x: 976.3, y: 628, h0x: 950.8, h0y: 624.3, h1x: 995, h1y: 630.7 },
    { x: 1033.9, y: 606.2, h0x: 1019.3, h0y: 625, h1x: 1044.8, h1y: 592.2 },
    { x: 1039, y: 552.5, h0x: 1046.2, h0y: 567.6, h1x: 1032.5, h1y: 538.9 },
    { x: 1032.4, y: 506.2, h0x: 1017.6, h0y: 525.3, h1x: 1038.3, h1y: 498.6 },
    { x: 1069.6, y: 489.6, h0x: 1046.5, h0y: 494, h1x: 1069.6, h1y: 489.6 },
  ],
  [
    { x: 826.6, y: 536.1, h0x: 826.6, h0y: 536.1, h1x: 844.8, h1y: 538.4 },
    { x: 866.5, y: 509.9, h0x: 859.5, h0y: 518.3, h1x: 873.5, h1y: 501.5 },
    { x: 905.1, y: 481.8, h0x: 887.1, h0y: 488, h1x: 929.3, h1y: 473.4 },
    { x: 959.2, y: 487.4, h0x: 945.1, h0y: 479.7, h1x: 973.3, h1y: 495.1 },
    { x: 1019.2, y: 502.1, h0x: 991.9, h0y: 517.8, h1x: 1040.9, h1y: 489.6 },
    { x: 1086.9, y: 485.2, h0x: 1061, h0y: 493.5, h1x: 1086.9, h1y: 485.2 },
  ],
];

const CHARACTER_SETS: CharacterSet[] = [
  {
    D: [
      [
        { x: 883.5, y: 438.8, h0x: 883.5, h0y: 438.8, h1x: 890.2, h1y: 429 },
        { x: 912.8, y: 423, h0x: 905.7, h0y: 424.2, h1x: 928.9, h1y: 420.4 },
        { x: 984.6, y: 439.1, h0x: 952.8, h0y: 424.3, h1x: 1016.4, h1y: 453.9 },
        { x: 1032.8, y: 490.3, h0x: 1029.9, h0y: 466.5, h1x: 1036, h1y: 517 },
        { x: 968.3, y: 585, h0x: 1026.8, h0y: 543.4, h1x: 949.1, h1y: 602.4 },
        { x: 946.6, y: 628, h0x: 945.6, h0y: 613.3, h1x: 947.4, h1y: 641.7 },
        { x: 969.7, y: 656.1, h0x: 955.6, h0y: 651.5, h1x: 983.8, h1y: 660.7 },
        { x: 1031.4, y: 649.5, h0x: 1006.6, h0y: 658.5, h1x: 1031.4, h1y: 649.5 },
      ],
      [
        { x: 950.3, y: 606.6, h0x: 950.3, h0y: 606.6, h1x: 962.7, h1y: 575.2 },
        { x: 965, y: 510.5, h0x: 965.9, h0y: 540.5, h1x: 963.5, h1y: 455.9 },
        { x: 912.9, y: 423, h0x: 945.9, h0y: 418.1, h1x: 912.9, h1y: 423 },
      ],
    ],
    L: [
      [
        { x: 887.58, y: 583.5, h0x: 887.58, h0y: 583.5, h1x: 908.26, h1y: 585.24 },
        { x: 938.5, y: 547.28, h0x: 937.94, h0y: 576.62, h1x: 939.22, h1y: 510.3 },
        { x: 919.17, y: 486.08, h0x: 925.19, h0y: 498.62, h1x: 913.15, h1y: 473.54 },
        { x: 918.68, y: 440.03, h0x: 897.11, h0y: 441.04, h1x: 940.25, h1y: 439.02 },
        { x: 950.36, y: 480.27, h0x: 947.75, h0y: 463.19, h1x: 953.31, h1y: 499.54 },
        { x: 947.27, y: 550.89, h0x: 947.27, h0y: 520.29, h1x: 947.27, h1y: 581.49 },
        { x: 953.79, y: 593.53, h0x: 938.36, h0y: 586.82, h1x: 965.85, h1y: 598.77 },
        { x: 990.43, y: 614.28, h0x: 974.55, h0y: 598.77, h1x: 1006.32, h1y: 629.79 },
        { x: 1032.41, y: 640, h0x: 1005.72, h0y: 636.49, h1x: 1032.41, h1y: 640 },
      ],
    ],
    M: [
      [
        { x: 730.8, y: 630.6, h0x: 730.8, h0y: 630.6, h1x: 754.6, h1y: 630.6 },
        { x: 799.8, y: 587.7, h0x: 783.2, h0y: 610.4, h1x: 816.4, h1y: 565 },
        { x: 836.5, y: 519.6, h0x: 824, h0y: 532.9, h1x: 861.9, h1y: 492.7 },
        { x: 901.1, y: 552.6, h0x: 888.1, h0y: 525.5, h1x: 914.1, h1y: 579.7 },
        { x: 957.6, y: 604.3, h0x: 937.2, h0y: 609.4, h1x: 987.2, h1y: 596.9 },
        { x: 979.1, y: 527.8, h0x: 983.9, h0y: 556.3, h1x: 971.9, h1y: 485.2 },
        { x: 1003.7, y: 428.2, h0x: 972.1, h0y: 443.7, h1x: 1035.3, h1y: 412.7 },
        { x: 1086.4, y: 509.1, h0x: 1074.1, h0y: 439.5, h1x: 1094.4, h1y: 554.6 },
        { x: 1157.4, y: 639.6, h0x: 1101.8, h0y: 643.7, h1x: 1157.4, h1y: 639.6 },
      ],
    ],
    O: SET0_O,
    R: [
      [
        { x: 851.9, y: 651.8, h0x: 851.9, h0y: 651.8, h1x: 867, h1y: 657 },
        { x: 869.1, y: 613.2, h0x: 881.1, h0y: 650.9, h1x: 860.6, h1y: 586.5 },
        { x: 863.2, y: 509, h0x: 854.8, h0y: 548, h1x: 870.2, h1y: 476.5 },
        { x: 910, y: 440.4, h0x: 889.8, h0y: 453.7, h1x: 937.2, h1y: 422.5 },
        { x: 965.4, y: 437.3, h0x: 960.3, h0y: 422.5, h1x: 979.7, h1y: 478.8 },
        { x: 912.5, y: 532.7, h0x: 911.8, h0y: 493, h1x: 913, h1y: 558.9 },
        { x: 959.4, y: 567.8, h0x: 937.4, h0y: 558.6, h1x: 992.2, h1y: 581.4 },
        { x: 1046.3, y: 608.9, h0x: 1018.3, h0y: 616.8, h1x: 1046.3, h1y: 608.9 },
      ],
    ],
    U: [
      [
        { x: 908.4, y: 482, h0x: 908.4, h0y: 482, h1x: 937.7, h1y: 463.9 },
        { x: 961.7, y: 497, h0x: 964, h0y: 471.3, h1x: 960.5, h1y: 510.7 },
        { x: 938.3, y: 577.4, h0x: 944.4, h0y: 547.4, h1x: 933.4, h1y: 601.5 },
        { x: 960, y: 621.2, h0x: 935.7, h0y: 621.2, h1x: 984.3, h1y: 621.2 },
        { x: 1005.7, y: 568.3, h0x: 997.8, h0y: 597.2, h1x: 1016.5, h1y: 528.8 },
        { x: 1037.7, y: 470.6, h0x: 1016.9, h0y: 488.7, h1x: 1050.8, h1y: 459.2 },
        { x: 1092.1, y: 466, h0x: 1076.3, h0y: 453.3, h1x: 1092.1, h1y: 466 },
      ],
    ],
    " ": null,
  },
  {
    D: [
      [
        { x: 887.3, y: 608.9, h0x: 887.3, h0y: 608.9, h1x: 899.8, h1y: 614.5 },
        { x: 922, y: 607.5, h0x: 911, h0y: 615, h1x: 930.3, h1y: 601.9 },
        { x: 934.9, y: 552.3, h0x: 938.2, h0y: 588.4, h1x: 931.3, h1y: 513.5 },
        { x: 930.1, y: 457.5, h0x: 912.6, h0y: 471.7, h1x: 936.7, h1y: 452.1 },
        { x: 961.9, y: 452.6, h0x: 954.1, h0y: 451.4, h1x: 975, h1y: 454.6 },
        { x: 1016.8, y: 487.1, h0x: 997.2, h0y: 459.3, h1x: 1029.4, h1y: 505 },
        { x: 1034.8, y: 546.8, h0x: 1034.7, h0y: 523.7, h1x: 1034.8, h1y: 570.1 },
        { x: 1013, y: 599.4, h0x: 1028.3, h0y: 587.3, h1x: 989, h1y: 618.4 },
        { x: 956.9, y: 620.4, h0x: 955.8, h0y: 617.1, h1x: 959, h1y: 626.6 },
        { x: 1028, y: 624.4, h0x: 1004.8, h0y: 631.2, h1x: 1028, h1y: 624.4 },
      ],
    ],
    L: [
      [
        { x: 906.9, y: 421.5, h0x: 906.9, h0y: 421.5, h1x: 920.4, h1y: 421.5 },
        { x: 914.2, y: 450, h0x: 920.5, h0y: 438.2, h1x: 907.9, h1y: 461.8 },
        { x: 900.2, y: 494.3, h0x: 904, h0y: 478.5, h1x: 892.3, h1y: 527.3 },
        { x: 880.2, y: 570.9, h0x: 879.6, h0y: 537, h1x: 881, h1y: 613.3 },
        { x: 909.4, y: 632.7, h0x: 891.4, h0y: 632.5, h1x: 931.5, h1y: 632.8 },
        { x: 950.7, y: 613.6, h0x: 939.2, h0y: 621.6, h1x: 960.1, h1y: 607.1 },
        { x: 992.3, y: 609.2, h0x: 976.9, h0y: 604.5, h1x: 992.3, h1y: 609.2 },
      ],
    ],
    M: [
      [
        { x: 783.5, y: 617, h0x: 783.5, h0y: 617, h1x: 830.7, h1y: 606.4 },
        { x: 838.7, y: 516, h0x: 833.9, h0y: 560.9, h1x: 842.4, h1y: 481.2 },
        { x: 862.7, y: 446.5, h0x: 849.2, h0y: 459.4, h1x: 876.2, h1y: 433.6 },
        { x: 901, y: 466.6, h0x: 897, h0y: 440.9, h1x: 907, h1y: 504.8 },
        { x: 900.8, y: 549.7, h0x: 896.1, h0y: 521.8, h1x: 905.5, h1y: 577.6 },
        { x: 949.7, y: 576.5, h0x: 929.2, h0y: 588.4, h1x: 970.2, h1y: 564.6 },
        { x: 973.3, y: 527, h0x: 971.4, h0y: 537.5, h1x: 977.2, h1y: 504.5 },
        { x: 1006.6, y: 486.6, h0x: 986.6, h0y: 483.6, h1x: 1026.6, h1y: 489.6 },
        { x: 1045.1, y: 539.9, h0x: 1038.5, h0y: 504.9, h1x: 1051.6, h1y: 574.6 },
        { x: 1135.5, y: 621.1, h0x: 1065.9, h0y: 621.1, h1x: 1135.5, h1y: 621.1 },
      ],
    ],
    R: [
      [
        { x: 850.5, y: 644.5, h0x: 850.5, h0y: 644.5, h1x: 878, h1y: 626.8 },
        { x: 868.8, y: 549.1, h0x: 876.3, h0y: 571.3, h1x: 867.1, h1y: 544 },
        { x: 852.8, y: 484.8, h0x: 858.3, h0y: 519, h1x: 849, h1y: 460.9 },
        { x: 855.5, y: 445.3, h0x: 849.9, h0y: 451.9, h1x: 865.1, h1y: 433.9 },
        { x: 900.1, y: 440.6, h0x: 886.2, h0y: 432.4, h1x: 917.9, h1y: 451.1 },
        { x: 917.2, y: 494.1, h0x: 923.1, h0y: 476.7, h1x: 909.4, h1y: 517.3 },
        { x: 884.3, y: 537.5, h0x: 884, h0y: 520.1, h1x: 884.5, h1y: 550.9 },
        { x: 901.7, y: 561.5, h0x: 899.7, h0y: 560.3, h1x: 923.7, h1y: 575 },
        { x: 966, y: 558.5, h0x: 952.7, h0y: 563.7, h1x: 1009.4, h1y: 541.5 },
        { x: 1040.5, y: 517.7, h0x: 1019.6, h0y: 513.7, h1x: 1040.5, h1y: 517.7 },
      ],
    ],
    U: [
      [
        { x: 812.2, y: 446, h0x: 812.2, h0y: 446, h1x: 832.7, h1y: 450.9 },
        { x: 834.7, y: 511.8, h0x: 836.7, h0y: 474.7, h1x: 832.5, h1y: 545.4 },
        { x: 840.7, y: 583.7, h0x: 831.2, h0y: 558.6, h1x: 842.6, h1y: 588.8 },
        { x: 888.5, y: 641.1, h0x: 861.8, h0y: 641.5, h1x: 922.1, h1y: 640.6 },
        { x: 923.1, y: 573, h0x: 923.1, h0y: 608.2, h1x: 923.1, h1y: 540 },
        { x: 946.1, y: 490.8, h0x: 922, h0y: 504.5, h1x: 963.9, h1y: 480.7 },
        { x: 1020.6, y: 503.6, h0x: 989.8, h0y: 500.7, h1x: 1020.6, h1y: 503.6 },
      ],
      [
        { x: 836.8, y: 568.4, h0x: 836.8, h0y: 568.4, h1x: 836.8, h1y: 568.4 },
        { x: 859.2, y: 595.8, h0x: 846.3, h0y: 590.3, h1x: 900.1, h1y: 613.1 },
        { x: 919.2, y: 617.2, h0x: 896, h0y: 633.6, h1x: 919.2, h1y: 617.2 },
      ],
    ],
    " ": null,
  },
  {
    M: [
      [
        { x: 812.5, y: 626.9, h0x: 795.5, h0y: 629.6, h1x: 836.7, h1y: 623.1 },
        { x: 841.8, y: 571.1, h0x: 848, h0y: 592.2, h1x: 834.5, h1y: 545.9 },
        { x: 793.4, y: 517.6, h0x: 806.3, h0y: 543.6, h1x: 783, h1y: 496.9 },
        { x: 801.8, y: 460.3, h0x: 787.3, h0y: 468.5, h1x: 816.4, h1y: 452.1 },
        { x: 829.3, y: 460.7, h0x: 822.7, h0y: 455.9, h1x: 842.1, h1y: 469.9 },
        { x: 851.8, y: 496, h0x: 842.4, h0y: 480.3, h1x: 861.2, h1y: 511.7 },
        { x: 892.6, y: 516.9, h0x: 872, h0y: 522.4, h1x: 908.3, h1y: 512.7 },
        { x: 920.2, y: 483.4, h0x: 915.8, h0y: 497.8, h1x: 924.9, h1y: 467.9 },
        { x: 933.3, y: 441.4, h0x: 926, h0y: 457.8, h1x: 938.8, h1y: 429.1 },
        { x: 964.3, y: 424.9, h0x: 948.8, h0y: 422.1, h1x: 984.3, h1y: 428.5 },
        { x: 996.6, y: 471, h0x: 994.3, h0y: 452.5, h1x: 999.7, h1y: 496.1 },
        { x: 994, y: 542.2, h0x: 993.1, h0y: 504, h1x: 994.4, h1y: 557.3 },
        { x: 1011.5, y: 578, h0x: 997.7, h0y: 573.9, h1x: 1027.9, h1y: 582.9 },
        { x: 1051.4, y: 561.5, h0x: 1043, h0y: 572, h1x: 1067.7, h1y: 541.3 },
        { x: 1073, y: 500.1, h0x: 1062.9, h0y: 524.3, h1x: 1080.2, h1y: 482.8 },
        { x: 1118.6, y: 477.2, h0x: 1098.3, h0y: 470.4, h1x: 1140.9, h1y: 484.6 },
        { x: 1134.1, y: 530.2, h0x: 1138.6, h0y: 518.3, h1x: 1115.2, h1y: 580.9 },
        { x: 1116.1, y: 632.3, h0x: 1109.1, h0y: 608.1, h1x: 1118.5, h1y: 641 },
        { x: 1152.8, y: 656.4, h0x: 1126.9, h0y: 655, h1x: 1152.8, h1y: 656.4 },
      ],
    ],
    R: [
      [
        { x: 821.8, y: 647.4, h0x: 821.8, h0y: 647.4, h1x: 841.3, h1y: 657.2 },
        { x: 853.3, y: 618.9, h0x: 866.2, h0y: 651.6, h1x: 825.8, h1y: 549.5 },
        { x: 852.7, y: 485.2, h0x: 834.6, h0y: 511.6, h1x: 869.9, h1y: 460.1 },
        { x: 919.7, y: 456.7, h0x: 906.8, h0y: 444.8, h1x: 934, h1y: 469.8 },
        { x: 894, y: 527.5, h0x: 919.4, h0y: 507.8, h1x: 879.9, h1y: 538.4 },
        { x: 868.4, y: 542.9, h0x: 869, h0y: 537.1, h1x: 867.5, h1y: 550.9 },
        { x: 911.3, y: 572.8, h0x: 887.1, h0y: 565, h1x: 932.2, h1y: 579.5 },
        { x: 974.3, y: 571, h0x: 956.6, h0y: 581.6, h1x: 995.3, h1y: 558.5 },
        { x: 1015.8, y: 527.7, h0x: 996.1, h0y: 538.9, h1x: 1015.8, h1y: 527.7 },
      ],
    ],
    U: [
      [
        { x: 862.9, y: 494.3, h0x: 862.9, h0y: 494.3, h1x: 881.3, h1y: 472.6 },
        { x: 925.9, y: 482.9, h0x: 905.7, h0y: 470.5, h1x: 943.9, h1y: 493.8 },
        { x: 947.5, y: 538.1, h0x: 949.5, h0y: 513, h1x: 945.5, h1y: 563.2 },
        { x: 991.8, y: 588.7, h0x: 955.2, h0y: 591, h1x: 1039, h1y: 585.8 },
        { x: 1028, y: 513.1, h0x: 1035.6, h0y: 543.3, h1x: 1020.4, h1y: 482.9 },
        { x: 1034.3, y: 434.9, h0x: 1015.4, h0y: 450.7, h1x: 1053.2, h1y: 419.1 },
        { x: 1090.5, y: 430.3, h0x: 1066.9, h0y: 420.8, h1x: 1090.5, h1y: 430.3 },
      ],
    ],
    " ": null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GLYPH HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function cloneGlyph(g: GlyphData): GlyphData {
  return g ? g.map((s) => s.map((p) => ({ ...p }))) : null;
}

function getGlyphBounds(g: GlyphSegment[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of g) for (const p of s) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

function availableSetsFor(c: SupportedChar) {
  return CHARACTER_SETS.flatMap((set, i) => (set[c] ? [i] : []));
}

function buildLetterShape(char: SupportedChar, setIndex: number, scale: number): LetterShape | null {
  if (char === " ") return { width: 160 * scale, segments: [], tuning: { offY: 0, bzIn: 1, bzOut: 1, idOut: 0 } };
  const glyph = cloneGlyph(CHARACTER_SETS[setIndex]?.[char] ?? null);
  if (!glyph) return null;

  const bounds = getGlyphBounds(glyph);
  const tuning = LETTER_TUNING[setIndex]?.[char] ?? { offY: 0, bzIn: 1, bzOut: 1, idOut: 0 };
  const cx = (bounds.minX + bounds.maxX) * 0.5;
  const cy = (bounds.minY + bounds.maxY) * 0.5;
  const oy = tuning.offY * 120;
  const hm = 105 * scale;

  const t = glyph.map((s) => s.map((p) => ({
    x: (p.x - cx) * scale, y: (p.y - cy + oy) * scale,
    h0x: (p.h0x - cx) * scale, h0y: (p.h0y - cy + oy) * scale,
    h1x: (p.h1x - cx) * scale, h1y: (p.h1y - cy + oy) * scale,
  })));

  for (const s of t) {
    if (s.length < 2) continue;
    const f = s[0];
    const di = Math.hypot(f.x - f.h1x, f.y - f.h1y) || 1;
    f.h0x = f.x + ((f.x - f.h1x) / di) * hm * tuning.bzIn;
    f.h0y = f.y + ((f.y - f.h1y) / di) * hm * tuning.bzIn;
    const l = s[s.length - 1];
    const do_ = Math.hypot(l.x - l.h0x, l.y - l.h0y) || 1;
    l.h1x = l.x + ((l.x - l.h0x) / do_) * hm * tuning.bzOut;
    l.h1y = l.y + ((l.y - l.h0y) / do_) * hm * tuning.bzOut;
  }

  return { width: (bounds.maxX - bounds.minX) * scale, segments: t, tuning };
}

function assembleTextPaths(text: string, width: number, height: number, choices: number[]) {
  const chars = text.toUpperCase().split("").filter((c) => "ROMULD ".includes(c)) as SupportedChar[];
  const bs = height / 760;
  const lsw = 120 * bs;
  const base = height * 0.54;
  const pad = width * 0.04;

  const shapes = chars
    .map((c, i) => buildLetterShape(c, choices[i] ?? availableSetsFor(c)[0] ?? 0, bs))
    .filter((s): s is LetterShape => s !== null);

  const total = shapes.reduce((sum, s, i) => sum + s.width + (i === shapes.length - 1 ? 0 : lsw), 0);
  const fitScale = total > 0 ? Math.min((width - pad * 2) / total, 1.08) : 1;

  const curves: GlyphSegment[] = [];
  let off = -(lsw * fitScale) * 0.5;

  for (let i = 0; i < shapes.length; i++) {
    const sh = shapes[i];
    const co = (sh.width + lsw) * fitScale;
    if (!sh.segments.length) { off += co; continue; }
    off += co * 0.5;

    const place = (s: GlyphSegment): GlyphSegment => s.map((p) => ({
      x: p.x * fitScale + off, y: p.y * fitScale,
      h0x: p.h0x * fitScale + off, h0y: p.h0y * fitScale,
      h1x: p.h1x * fitScale + off, h1y: p.h1y * fitScale,
    }));

    sh.segments.forEach((s, si) => {
      const pl = place(s);
      if (curves.length === 0 || i === 0 || si > 0) curves.push(pl);
      else curves[curves.length - 1].push(...pl);
    });

    const oi = sh.tuning.idOut, ci = curves.length - 1, sw = ci - oi;
    if (oi > 0 && sw >= 0) [curves[ci], curves[sw]] = [curves[sw], curves[ci]];
    off += co * 0.5;
  }

  let mnX = Infinity, mxX = -Infinity, mnY = Infinity, mxY = -Infinity;
  for (const c of curves) for (const p of c) {
    mnX = Math.min(mnX, p.x); mxX = Math.max(mxX, p.x);
    mnY = Math.min(mnY, p.y); mxY = Math.max(mxY, p.y);
  }
  const dx = width * 0.5 - (mnX + mxX) * 0.5;
  const dy = base - (mnY + mxY) * 0.5;

  for (const c of curves) for (const p of c) {
    p.x += dx; p.h0x += dx; p.h1x += dx;
    p.y += dy; p.h0y += dy; p.h1y += dy;
  }

  return { curves, fitScale, letterScale: bs * fitScale };
}

// Convert bezier control-point array → SVG cubic path string
function toPathD(seg: GlyphSegment): string {
  if (seg.length < 2) return "";
  const n = (v: number) => +v.toFixed(2);
  const parts = [`M ${n(seg[0].x)} ${n(seg[0].y)}`];
  for (let i = 0; i < seg.length - 1; i++) {
    const c = seg[i], nx = seg[i + 1];
    parts.push(`C ${n(c.h1x)} ${n(c.h1y)} ${n(nx.h0x)} ${n(nx.h0y)} ${n(nx.x)} ${n(nx.y)}`);
  }
  return parts.join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders "romulodm" in the Igaratipo river-type style.
 *
 * Rendering pipeline (mirrors the original GLSL shaders):
 *   feTurbulence → feDisplacementMap → feGaussianBlur → feColorMatrix → feComposite
 *
 * SVG is resolution-independent: perfectly sharp at any screen density.
 */
export default function IgaratipoSignature({
  strokeColor = "#b6e300",
  backgroundColor = "transparent",
  thickness = 0.9,
  noiseScale = 32,
  flowSpeed = 0.4,
  width = 1400,
  height = 320,
  className,
}: IgaratipoSignatureProps) {
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const choicesRef = useRef<number[] | null>(null);
  if (choicesRef.current === null) {
    const chars = "ROMULODM".split("") as SupportedChar[];
    choicesRef.current = chars.map((c) => {
      const available = availableSetsFor(c);
      return available[Math.floor(Math.random() * available.length)] ?? 0;
    });
  }
  const choices = choicesRef.current;

  const { curves, fitScale } = useMemo(
    () => assembleTextPaths("romulodm", width, height, choices),
    [width, height, choices],
  );

  const pathDs = useMemo(() => curves.map(toPathD), [curves]);

  // Visual metrics
  const strokeWidth = Math.max(height * 0.036 * thickness * fitScale, 4);
  // Blur must be large enough to merge adjacent letter strokes into blobs
  const blurStd = strokeWidth * 0.58;
  // feColorMatrix alpha row: output = slope × alpha + intercept (clamped 0–1)
  // Higher slope = sharper, more anti-aliased edge (vs hard pixel threshold)
  const slope = 22;
  const intercept = -9;

  // Animate turbulence baseFrequency for the flowing organic movement
  useEffect(() => {
    const step = flowSpeed * 0.003;
    console.log("teste")
    const loop = () => {
      timeRef.current += step;
      const t = timeRef.current;
      if (turbRef.current) {
        const bf1 = (0.005 + Math.sin(t * 0.71) * 0.0016).toFixed(5);
        const bf2 = (0.007 + Math.cos(t * 0.53) * 0.0014).toFixed(5);
        turbRef.current.setAttribute("baseFrequency", `${bf1} ${bf2}`);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [flowSpeed]);

  const hasBackground = backgroundColor !== "transparent" && backgroundColor !== "none";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      className={className}
      aria-label="romulodm"
      role="img"
      style={{ display: "block", overflow: "visible" }}
    >
      {hasBackground && <rect width={width} height={height} fill={backgroundColor} />}

      <defs>
        <filter
          id="igara-river"
          x="-25%" y="-65%"
          width="150%" height="230%"
          colorInterpolationFilters="sRGB"
        >
          {/* 1 — Organic noise field, animated via JS */}
          <feTurbulence
            ref={turbRef}
            type="fractalNoise"
            baseFrequency="0.005 0.007"
            numOctaves="2"
            stitchTiles="stitch"
            result="noise"
          />

          {/* 2 — Warp source strokes using noise → river-like distortion */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={noiseScale}
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />

          {/* 3 — Blur displaced strokes so nearby paths merge (metaball effect) */}
          <feGaussianBlur
            in="displaced"
            stdDeviation={blurStd}
            result="blur"
          />

          {/* 4 — Re-sharpen alpha into smooth anti-aliased contour (GLSL antialias pass) */}
          <feColorMatrix
            in="blur"
            type="matrix"
            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${slope} ${intercept}`}
            result="goo"
          />

          {/* 5 — Clip the fill colour to the goo mask to avoid fringing */}
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>

      <g filter="url(#igara-river)">
        {pathDs.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
}