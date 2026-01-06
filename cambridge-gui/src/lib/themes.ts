export interface Theme {
    id: string;
    name: string;
    colors: {
        background: string;
        foreground: string; // text-color
        primary: string; // main-color
        caret: string; // caret-color (accent)
        sub: string; // sub-color (muted text/borders)
        subAlt: string; // sub-alt-color (cards/secondary bg)
        error: string; // error-color
    };
}

export const oledTheme: Theme = {
    id: 'oled',
    name: 'OLED (Default)',
    colors: {
        background: '#000000',
        foreground: '#ffffff',
        primary: '#ffffff',
        caret: '#ffffff',
        sub: '#52525b', // zinc-600
        subAlt: '#18181b', // zinc-900 (cards)
        error: '#ef4444', // red-500
    }
};

export const themes: Theme[] = [
    oledTheme,
    {
        id: '8008',
        name: '8008',
        colors: {
            background: '#333a45',
            foreground: '#e9ecf0',
            primary: '#f44c7f',
            caret: '#f44c7f',
            sub: '#939eae',
            subAlt: '#2e343d',
            error: '#da3333'
        }
    },
    {
        id: '80s_after_dark',
        name: '80s After Dark',
        colors: {
            background: '#1b1d36',
            foreground: '#e1e7ec',
            primary: '#fca6d1',
            caret: '#99d6ea',
            sub: '#99d6ea',
            subAlt: '#17182c',
            error: '#fffb85'
        }
    },
    {
        id: '9009',
        name: '9009',
        colors: {
            background: '#eeebe2',
            foreground: '#080909',
            primary: '#080909',
            caret: '#7fa480',
            sub: '#99947f',
            subAlt: '#d3cfc1',
            error: '#c87e74'
        }
    },
    {
        id: 'aether',
        name: 'Aether',
        colors: {
            background: '#101820',
            foreground: '#eedaea',
            primary: '#eedaea',
            caret: '#eedaea',
            sub: '#cf6bdd',
            subAlt: '#292136',
            error: '#ff5253'
        }
    },
    {
        id: 'alduin',
        name: 'Alduin',
        colors: {
            background: '#1c1c1c',
            foreground: '#f5f3ed',
            primary: '#dfd7af',
            caret: '#e3e3e3',
            sub: '#444444',
            subAlt: '#242424',
            error: '#af5f5f'
        }
    },
    {
        id: 'alpine',
        name: 'Alpine',
        colors: {
            background: '#6c687f',
            foreground: '#ffffff',
            primary: '#ffffff',
            caret: '#585568',
            sub: '#9994b8',
            subAlt: '#77738c',
            error: '#e32b2b'
        }
    },
    {
        id: 'anti_hero',
        name: 'Anti Hero',
        colors: {
            background: '#00002e',
            foreground: '#f1deef',
            primary: '#ffadad',
            caret: '#ffffff',
            sub: '#ff3d8b',
            subAlt: '#060548',
            error: '#8fecff'
        }
    },
    {
        id: 'arch',
        name: 'Arch',
        colors: {
            background: '#0c0d11',
            foreground: '#f6f5f5',
            primary: '#7ebab5',
            caret: '#7ebab5',
            sub: '#454864',
            subAlt: '#171a25',
            error: '#ff4754'
        }
    },
    {
        id: 'aurora',
        name: 'Aurora',
        colors: {
            background: '#011926',
            foreground: '#fff',
            primary: '#00e980',
            caret: '#00e980',
            sub: '#245c69',
            subAlt: '#000c13',
            error: '#b94da1'
        }
    },
    {
        id: 'beach',
        name: 'Beach',
        colors: {
            background: '#ffeead',
            foreground: '#5b7869',
            primary: '#96ceb4',
            caret: '#ffcc5c',
            sub: '#ffcc5c',
            subAlt: '#f7dc8f',
            error: '#ff6f69'
        }
    },
    {
        id: 'bento',
        name: 'Bento',
        colors: {
            background: '#2d394d',
            foreground: '#fffaf8',
            primary: '#ff7a90',
            caret: '#ff7a90',
            sub: '#4a768d',
            subAlt: '#263041',
            error: '#ee2a3a'
        }
    },
    {
        id: 'bingsu',
        name: 'Bingsu',
        colors: {
            background: 'linear-gradient(215deg, #cbb8ba, #706768)',
            foreground: '#ebe6ea',
            primary: '#83616e',
            caret: '#ebe6ea',
            sub: '#48373d',
            subAlt: '#ab989e',
            error: '#921341'
        }
    },
    {
        id: 'bliss',
        name: 'Bliss',
        colors: {
            background: '#262727',
            foreground: '#fff',
            primary: '#f0d3c9',
            caret: '#f0d3c9',
            sub: '#665957',
            subAlt: '#343231',
            error: '#bd4141'
        }
    },
    {
        id: 'blue_dolphin',
        name: 'Blue Dolphin',
        colors: {
            background: '#003950',
            foreground: '#82eaff',
            primary: '#ffcefb',
            caret: '#00bcd4',
            sub: '#00e4ff',
            subAlt: '#014961',
            error: '#ffbde6'
        }
    },
    {
        id: 'blueberry_dark',
        name: 'Blueberry Dark',
        colors: {
            background: '#212b42',
            foreground: '#91b4d5',
            primary: '#add7ff',
            caret: '#962f7e',
            sub: '#5c7da5',
            subAlt: '#1b2334',
            error: '#df4576'
        }
    },
    {
        id: 'blueberry_light',
        name: 'Blueberry Light',
        colors: {
            background: '#dae0f5',
            foreground: '#678198',
            primary: '#506477',
            caret: '#df4576',
            sub: '#92a4be',
            subAlt: '#c1c7df',
            error: '#df4576'
        }
    },
    {
        id: 'botanical',
        name: 'Botanical',
        colors: {
            background: '#7b9c98',
            foreground: '#eaf1f3',
            primary: '#eaf1f3',
            caret: '#abc6c4',
            sub: '#495755',
            subAlt: '#72908d',
            error: '#f6c9b4'
        }
    },
    {
        id: 'bouquet',
        name: 'Bouquet',
        colors: {
            background: '#173f35',
            foreground: '#e9e0d2',
            primary: '#eaa09c',
            caret: '#eaa09c',
            sub: '#408e7b',
            subAlt: '#1f4e43',
            error: '#d44729'
        }
    },
    {
        id: 'breeze',
        name: 'Breeze',
        colors: {
            background: '#e8d5c4',
            foreground: '#1b4c5e',
            primary: '#7d67a9',
            caret: '#7d67a9',
            sub: '#3a98b9',
            subAlt: '#f6e6da',
            error: '#7d67a9'
        }
    },
    {
        id: 'bushido',
        name: 'Bushido',
        colors: {
            background: '#242933',
            foreground: '#f6f0e9',
            primary: '#ec4c56',
            caret: '#ec4c56',
            sub: '#596172',
            subAlt: '#1c222d',
            error: '#ec4c56'
        }
    },
    {
        id: 'cafe',
        name: 'Cafe',
        colors: {
            background: '#ceb18d',
            foreground: '#14120f',
            primary: '#14120f',
            caret: '#14120f',
            sub: '#d4d2d1',
            subAlt: '#bba180',
            error: '#c82931'
        }
    },
    {
        id: 'camping',
        name: 'Camping',
        colors: {
            background: '#faf1e4',
            foreground: '#3c403b',
            primary: '#618c56',
            caret: '#618c56',
            sub: '#c2b8aa',
            subAlt: '#e7dccb',
            error: '#ad4f4e'
        }
    },
    {
        id: 'carbon',
        name: 'Carbon',
        colors: {
            background: '#313131',
            foreground: '#f5e6c8',
            primary: '#f66e0d',
            caret: '#f66e0d',
            sub: '#616161',
            subAlt: '#2b2b2b',
            error: '#e72d2d'
        }
    },
    {
        id: 'catppuccin',
        name: 'Catppuccin',
        colors: {
            background: '#1e1e2e',
            foreground: '#cdd6f4',
            primary: '#cba6f7',
            caret: '#f2cdcd',
            sub: '#7f849c',
            subAlt: '#181825',
            error: '#f38ba8'
        }
    },
    {
        id: 'chaos_theory',
        name: 'Chaos Theory',
        colors: {
            background: '#141221',
            foreground: '#dde5ed',
            primary: '#fd77d7',
            caret: '#dde5ed',
            sub: '#676e8a',
            subAlt: '#1e1d2f',
            error: '#fd77d7'
        }
    },
    {
        id: 'cheesecake',
        name: 'Cheesecake',
        colors: {
            background: '#fdf0d5',
            foreground: '#3a3335',
            primary: '#8e2949',
            caret: '#892948',
            sub: '#d91c81',
            subAlt: '#f3e2bf',
            error: '#5cf074'
        }
    },
    {
        id: 'cherry_blossom',
        name: 'Cherry Blossom',
        colors: {
            background: '#323437',
            foreground: '#d1d0c5',
            primary: '#d65ccc',
            caret: '#ffffff',
            sub: '#787d82',
            subAlt: '#2d2f31',
            error: '#ca4754'
        }
    },
    {
        id: 'comfy',
        name: 'Comfy',
        colors: {
            background: '#4a5b6e',
            foreground: '#f5efee',
            primary: '#f8cdc6',
            caret: '#9ec1cc',
            sub: '#9ec1cc',
            subAlt: '#425366',
            error: '#c9465e'
        }
    },
    {
        id: 'copper',
        name: 'Copper',
        colors: {
            background: '#442f29',
            foreground: '#e7e0de',
            primary: '#b46a55',
            caret: '#c25c42',
            sub: '#7ebab5',
            subAlt: '#50362e',
            error: '#a32424'
        }
    },
    {
        id: 'creamsicle',
        name: 'Creamsicle',
        colors: {
            background: '#ff9869',
            foreground: '#fcfcf8',
            primary: '#fcfcf8',
            caret: '#fcfcf8',
            sub: '#ff661f',
            subAlt: '#fe8954',
            error: '#6a0dad'
        }
    },
    {
        id: 'cy_red',
        name: 'Cy Red',
        colors: {
            background: '#6e2626',
            foreground: '#ffaaaa',
            primary: '#e55050',
            caret: '#541d1d',
            sub: '#ff6060',
            subAlt: '#3f1616',
            error: '#919fd9'
        }
    },
    {
        id: 'cyberspace',
        name: 'Cyberspace',
        colors: {
            background: '#181c18',
            foreground: '#c2fbe1',
            primary: '#00ce7c',
            caret: '#00ce7c',
            sub: '#9578d3',
            subAlt: '#131613',
            error: '#ff5f5f'
        }
    },
    {
        id: 'dark',
        name: 'Dark',
        colors: {
            background: '#111',
            foreground: '#eee',
            primary: '#eee',
            caret: '#eee',
            sub: '#444',
            subAlt: '#191919',
            error: '#da3333'
        }
    },
    {
        id: 'dark_magic_girl',
        name: 'Dark Magic Girl',
        colors: {
            background: '#091f2c',
            foreground: '#a288d9',
            primary: '#f5b1cc',
            caret: '#a288d9',
            sub: '#93e8d3',
            subAlt: '#071823',
            error: '#e45c96'
        }
    },
    {
        id: 'dark_note',
        name: 'Dark Note',
        colors: {
            background: '#1f1f1f',
            foreground: '#d2dff4',
            primary: '#f2c17b',
            caret: '#e3dce0',
            sub: '#768f95',
            subAlt: '#141414',
            error: '#ff0000'
        }
    },
    {
        id: 'darling',
        name: 'Darling',
        colors: {
            background: '#fec8cd',
            foreground: '#ffffff',
            primary: '#ffffff',
            caret: '#ffffff',
            sub: '#a30000',
            subAlt: '#f2babd',
            error: '#2e7dde'
        }
    },
    {
        id: 'deku',
        name: 'Deku',
        colors: {
            background: '#058b8c',
            foreground: '#f7f2ea',
            primary: '#b63530',
            caret: '#b63530',
            sub: '#255458',
            subAlt: '#0e7d7e',
            error: '#b63530'
        }
    },
    {
        id: 'desert_oasis',
        name: 'Desert Oasis',
        colors: {
            background: '#fff2d5',
            foreground: '#332800',
            primary: '#d19d01',
            caret: '#3a87fe',
            sub: '#0061fe',
            subAlt: '#eddebc',
            error: '#76bb40'
        }
    },
    {
        id: 'dev',
        name: 'Dev',
        colors: {
            background: '#1b2028',
            foreground: '#ccccb5',
            primary: '#23a9d5',
            caret: '#4b5975',
            sub: '#4b5975',
            subAlt: '#151a21',
            error: '#b81b2c'
        }
    },
    {
        id: 'diner',
        name: 'Diner',
        colors: {
            background: '#537997',
            foreground: '#dfdbc8',
            primary: '#c3af5b',
            caret: '#ad5145',
            sub: '#445c7f',
            subAlt: '#4d6f8b',
            error: '#ad5145'
        }
    },
    {
        id: 'dino',
        name: 'Dino',
        colors: {
            background: '#ffffff',
            foreground: '#1d221f',
            primary: '#40d672',
            caret: '#40d672',
            sub: '#d5d5d5',
            subAlt: '#cafad8',
            error: '#ff5f5f'
        }
    },
    {
        id: 'discord',
        name: 'Discord',
        colors: {
            background: '#313338',
            foreground: '#dcdee3',
            primary: '#5a65ea',
            caret: '#5a65ea',
            sub: '#565861',
            subAlt: '#2b2d31',
            error: '#df4f4b'
        }
    },
    {
        id: 'dmg',
        name: 'Dmg',
        colors: {
            background: '#dadbdc',
            foreground: '#414141',
            primary: '#ae185e',
            caret: '#384693',
            sub: '#3846b1',
            subAlt: '#bec1d2',
            error: '#ae185e'
        }
    },
    {
        id: 'dollar',
        name: 'Dollar',
        colors: {
            background: '#e4e4d4',
            foreground: '#555a56',
            primary: '#6b886b',
            caret: '#424643',
            sub: '#8a9b69',
            subAlt: '#cbd0bf',
            error: '#d60000'
        }
    },
    {
        id: 'dots',
        name: 'Dots',
        colors: {
            background: '#121520',
            foreground: '#fff',
            primary: '#fff',
            caret: '#fff',
            sub: '#676e8a',
            subAlt: '#1b1e2c',
            error: '#da3333'
        }
    },
    {
        id: 'dracula',
        name: 'Dracula',
        colors: {
            background: '#282a36',
            foreground: '#f8f8f2',
            primary: '#bd93f9',
            caret: '#bd93f9',
            sub: '#6272a4',
            subAlt: '#20222c',
            error: '#ff5555'
        }
    },
    {
        id: 'drowning',
        name: 'Drowning',
        colors: {
            background: '#191826',
            foreground: '#9393a7',
            primary: '#4a6fb5',
            caret: '#4f85e8',
            sub: '#50688c',
            subAlt: '#1e1f2f',
            error: '#be555f'
        }
    },
    {
        id: 'dualshot',
        name: 'Dualshot',
        colors: {
            background: '#737373',
            foreground: '#212222',
            primary: '#212222',
            caret: '#212222',
            sub: '#aaaaaa',
            subAlt: '#646464',
            error: '#c82931'
        }
    },
    {
        id: 'earthsong',
        name: 'Earthsong',
        colors: {
            background: '#292521',
            foreground: '#e6c7a8',
            primary: '#509452',
            caret: '#1298ba',
            sub: '#f5ae2d',
            subAlt: '#1d1b18',
            error: '#7e2a33'
        }
    },
    {
        id: 'everblush',
        name: 'Everblush',
        colors: {
            background: '#141b1e',
            foreground: '#dadada',
            primary: '#8ccf7e',
            caret: '#6cbfbf',
            sub: '#838887',
            subAlt: '#232a2d',
            error: '#e57474'
        }
    },
    {
        id: 'evil_eye',
        name: 'Evil Eye',
        colors: {
            background: '#0084c2',
            foreground: '#171718',
            primary: '#f7f2ea',
            caret: '#f7f2ea',
            sub: '#01589f',
            subAlt: '#0c79be',
            error: '#ca4754'
        }
    },
    {
        id: 'ez_mode',
        name: 'Ez Mode',
        colors: {
            background: '#0068c6',
            foreground: '#ffffff',
            primary: '#fa62d5',
            caret: '#4ddb47',
            sub: '#138bf7',
            subAlt: '#005bac',
            error: '#4ddb47'
        }
    },
    {
        id: 'fire',
        name: 'Fire',
        colors: {
            background: '#0f0000',
            foreground: '#ffffff',
            primary: '#b31313',
            caret: '#b31313',
            sub: '#683434',
            subAlt: '#200a0a',
            error: '#2f3cb6'
        }
    },
    {
        id: 'fledgling',
        name: 'Fledgling',
        colors: {
            background: '#3b363f',
            foreground: '#e6d5d3',
            primary: '#fc6e83',
            caret: '#474747',
            sub: '#8e5568',
            subAlt: '#332e38',
            error: '#f52443'
        }
    },
    {
        id: 'fleuriste',
        name: 'Fleuriste',
        colors: {
            background: '#c6b294',
            foreground: '#091914',
            primary: '#405a52',
            caret: '#8a785b',
            sub: '#64374d',
            subAlt: '#b4a389',
            error: '#990000'
        }
    },
    {
        id: 'floret',
        name: 'Floret',
        colors: {
            background: '#00272c',
            foreground: '#e5e5e5',
            primary: '#ffdd6d',
            caret: '#c3bd40',
            sub: '#779097',
            subAlt: '#173033',
            error: '#8a4000'
        }
    },
    {
        id: 'froyo',
        name: 'Froyo',
        colors: {
            background: '#e1dacb',
            foreground: '#7b7d7d',
            primary: '#7b7d7d',
            caret: '#7b7d7d',
            sub: '#b29c5e',
            subAlt: '#d3cdc1',
            error: '#f28578'
        }
    },
    {
        id: 'frozen_llama',
        name: 'Frozen Llama',
        colors: {
            background: '#9bf2ea',
            foreground: '#ffffff',
            primary: '#6d44a6',
            caret: '#ffffff',
            sub: '#b690fd',
            subAlt: '#7fe7dd',
            error: '#e42629'
        }
    },
    {
        id: 'fruit_chew',
        name: 'Fruit Chew',
        colors: {
            background: '#d6d3d6',
            foreground: '#282528',
            primary: '#5c1e5f',
            caret: '#b92221',
            sub: '#b49cb5',
            subAlt: '#cabfca',
            error: '#bd2621'
        }
    },
    {
        id: 'fundamentals',
        name: 'Fundamentals',
        colors: {
            background: '#727474',
            foreground: '#131313',
            primary: '#7fa482',
            caret: '#196378',
            sub: '#cac4be',
            subAlt: '#666868',
            error: '#5e477c'
        }
    },
    {
        id: 'future_funk',
        name: 'Future Funk',
        colors: {
            background: '#2e1a47',
            foreground: '#f7f2ea',
            primary: '#f7f2ea',
            caret: '#f7f2ea',
            sub: '#c18fff',
            subAlt: '#27173c',
            error: '#f04e98'
        }
    },
    {
        id: 'github',
        name: 'Github',
        colors: {
            background: '#212830',
            foreground: '#ccdae6',
            primary: '#41ce5c',
            caret: '#41ce5c',
            sub: '#788386',
            subAlt: '#141b23',
            error: '#c23e3a'
        }
    },
    {
        id: 'godspeed',
        name: 'Godspeed',
        colors: {
            background: '#eae4cf',
            foreground: '#646669',
            primary: '#9abbcd',
            caret: '#f4d476',
            sub: '#ada998',
            subAlt: '#ded9c9',
            error: '#ca4754'
        }
    },
    {
        id: 'graen',
        name: 'Graen',
        colors: {
            background: '#303c36',
            foreground: '#a59682',
            primary: '#a59682',
            caret: '#601420',
            sub: '#181d1a',
            subAlt: '#36453c',
            error: '#601420'
        }
    },
    {
        id: 'grand_prix',
        name: 'Grand Prix',
        colors: {
            background: '#36475c',
            foreground: '#c1c7d7',
            primary: '#c0d036',
            caret: '#c0d036',
            sub: '#5c6c80',
            subAlt: '#42536b',
            error: '#fc5727'
        }
    },
    {
        id: 'grape',
        name: 'Grape',
        colors: {
            background: '#2c003e',
            foreground: '#fff',
            primary: '#ff8f00',
            caret: '#ff8f00',
            sub: '#6e225e',
            subAlt: '#1f002d',
            error: '#ff4081'
        }
    },
    {
        id: 'gruvbox_dark',
        name: 'Gruvbox Dark',
        colors: {
            background: '#282828',
            foreground: '#ebdbb2',
            primary: '#d79921',
            caret: '#fabd2f',
            sub: '#665c54',
            subAlt: '#212121',
            error: '#fb4934'
        }
    },
    {
        id: 'gruvbox_light',
        name: 'Gruvbox Light',
        colors: {
            background: '#fbf1c7',
            foreground: '#3c3836',
            primary: '#689d6a',
            caret: '#689d6a',
            sub: '#a89984',
            subAlt: '#daceae',
            error: '#cc241d'
        }
    },
    {
        id: 'hammerhead',
        name: 'Hammerhead',
        colors: {
            background: '#030613',
            foreground: '#e2f1f5',
            primary: '#4fcdb9',
            caret: '#4fcdb9',
            sub: '#213c53',
            subAlt: '#0a1928',
            error: '#e32b2b'
        }
    },
    {
        id: 'hanok',
        name: 'Hanok',
        colors: {
            background: '#d8d2c3',
            foreground: '#393b3b',
            primary: '#513a2a',
            caret: '#513a2a',
            sub: '#8b6f5c',
            subAlt: '#cdc0af',
            error: '#ca4754'
        }
    },
    {
        id: 'hedge',
        name: 'Hedge',
        colors: {
            background: '#415e31',
            foreground: '#f7f1d6',
            primary: '#6a994e',
            caret: '#f2efbb',
            sub: '#ede5b4',
            subAlt: '#38502a',
            error: '#ca3d3f'
        }
    },
    {
        id: 'honey',
        name: 'Honey',
        colors: {
            background: '#f2aa00',
            foreground: '#f3eecb',
            primary: '#fff546',
            caret: '#795200',
            sub: '#a66b00',
            subAlt: '#e19e00',
            error: '#df3333'
        }
    },
    {
        id: 'horizon',
        name: 'Horizon',
        colors: {
            background: '#1c1e26',
            foreground: '#bbbbbb',
            primary: '#c4a88a',
            caret: '#bbbbbb',
            sub: '#db886f',
            subAlt: '#17181f',
            error: '#d55170'
        }
    },
    {
        id: 'husqy',
        name: 'Husqy',
        colors: {
            background: '#000000',
            foreground: '#ebd7ff',
            primary: '#c58aff',
            caret: '#c58aff',
            sub: '#972fff',
            subAlt: '#1e001e',
            error: '#da3333'
        }
    },
    {
        id: 'iceberg_dark',
        name: 'Iceberg Dark',
        colors: {
            background: '#161821',
            foreground: '#c6c8d1',
            primary: '#84a0c6',
            caret: '#d2d4de',
            sub: '#595e76',
            subAlt: '#232531',
            error: '#e27878'
        }
    },
    {
        id: 'iceberg_light',
        name: 'Iceberg Light',
        colors: {
            background: '#e8e9ec',
            foreground: '#33374c',
            primary: '#2d539e',
            caret: '#262a3f',
            sub: '#adb1c4',
            subAlt: '#ccceda',
            error: '#cc517a'
        }
    },
    {
        id: 'incognito',
        name: 'Incognito',
        colors: {
            background: '#0e0e0e',
            foreground: '#c6c6c6',
            primary: '#ff9900',
            caret: '#ff9900',
            sub: '#555555',
            subAlt: '#151515',
            error: '#e44545'
        }
    },
    {
        id: 'ishtar',
        name: 'Ishtar',
        colors: {
            background: '#202020',
            foreground: '#fae1c3',
            primary: '#91170c',
            caret: '#c58940',
            sub: '#847869',
            subAlt: '#272727',
            error: '#bb1e10'
        }
    },
    {
        id: 'iv_clover',
        name: 'Iv Clover',
        colors: {
            background: '#a0a0a0',
            foreground: '#3b2d3b',
            primary: '#573e40',
            caret: '#8d8d8d',
            sub: '#353535',
            subAlt: '#bebebe',
            error: '#937173'
        }
    },
    {
        id: 'iv_spade',
        name: 'Iv Spade',
        colors: {
            background: '#0c0c0c',
            foreground: '#d3c2c3',
            primary: '#b7976a',
            caret: '#bebebe',
            sub: '#404040',
            subAlt: '#121212',
            error: '#9d7b7d'
        }
    },
    {
        id: 'joker',
        name: 'Joker',
        colors: {
            background: '#1a0e25',
            foreground: '#e9e2f5',
            primary: '#99de1e',
            caret: '#99de1e',
            sub: '#7554a3',
            subAlt: '#14081f',
            error: '#e32b2b'
        }
    },
    {
        id: 'laser',
        name: 'Laser',
        colors: {
            background: '#221b44',
            foreground: '#dbe7e8',
            primary: '#009eaf',
            caret: '#009eaf',
            sub: '#b82356',
            subAlt: '#1e173b',
            error: '#a8d400'
        }
    },
    {
        id: 'lavender',
        name: 'Lavender',
        colors: {
            background: '#ada6c2',
            foreground: '#2f2a41',
            primary: '#e4e3e9',
            caret: '#e4e3e9',
            sub: '#e4e3e9',
            subAlt: '#a19bb9',
            error: '#ca4754'
        }
    },
    {
        id: 'leather',
        name: 'Leather',
        colors: {
            background: '#a86948',
            foreground: '#ffe4bc',
            primary: '#ffe4bc',
            caret: '#ef6d49',
            sub: '#81482b',
            subAlt: '#9a5f3f',
            error: '#ca4754'
        }
    },
    {
        id: 'lil_dragon',
        name: 'Lil Dragon',
        colors: {
            background: '#ebe1ef',
            foreground: '#212b43',
            primary: '#8a5bd6',
            caret: '#212b43',
            sub: '#a28db8',
            subAlt: '#dac7e2',
            error: '#f794ca'
        }
    },
    {
        id: 'lilac_mist',
        name: 'Lilac Mist',
        colors: {
            background: '#fffbfe',
            foreground: '#5c2954',
            primary: '#b94189',
            caret: '#e099d6',
            sub: '#e094c2',
            subAlt: '#ecdcee',
            error: '#ff6f69'
        }
    },
    {
        id: 'lime',
        name: 'Lime',
        colors: {
            background: '#7c878e',
            foreground: '#bfcfdc',
            primary: '#93c247',
            caret: '#93c247',
            sub: '#4b5257',
            subAlt: '#737d82',
            error: '#ea4221'
        }
    },
    {
        id: 'luna',
        name: 'Luna',
        colors: {
            background: '#221c35',
            foreground: '#ffe3eb',
            primary: '#f67599',
            caret: '#f67599',
            sub: '#5a3a7e',
            subAlt: '#2f2346',
            error: '#efc050'
        }
    },
    {
        id: 'macroblank',
        name: 'Macroblank',
        colors: {
            background: '#b2d2c8',
            foreground: '#490909',
            primary: '#c13117',
            caret: '#766f71',
            sub: '#717977',
            subAlt: '#c6ddd3',
            error: '#c13117'
        }
    },
    {
        id: 'magic_girl',
        name: 'Magic Girl',
        colors: {
            background: '#ffffff',
            foreground: '#00ac8c',
            primary: '#f5b1cc',
            caret: '#e45c96',
            sub: '#93e8d3',
            subAlt: '#f2f2f2',
            error: '#ffe495'
        }
    },
    {
        id: 'mashu',
        name: 'Mashu',
        colors: {
            background: '#2b2b2c',
            foreground: '#f1e2e4',
            primary: '#76689a',
            caret: '#76689a',
            sub: '#d8a0a6',
            subAlt: '#27242c',
            error: '#d44729'
        }
    },
    {
        id: 'matcha_moccha',
        name: 'Matcha Moccha',
        colors: {
            background: '#523525',
            foreground: '#ecddcc',
            primary: '#7ec160',
            caret: '#7ec160',
            sub: '#9e6749',
            subAlt: '#422b1e',
            error: '#fb4934'
        }
    },
    {
        id: 'material',
        name: 'Material',
        colors: {
            background: '#263238',
            foreground: '#e6edf3',
            primary: '#80cbc4',
            caret: '#80cbc4',
            sub: '#4c6772',
            subAlt: '#2e3c43',
            error: '#fb4934'
        }
    },
    {
        id: 'matrix',
        name: 'Matrix',
        colors: {
            background: '#000000',
            foreground: '#d1ffcd',
            primary: '#15ff00',
            caret: '#15ff00',
            sub: '#006500',
            subAlt: '#032000',
            error: '#da3333'
        }
    },
    {
        id: 'menthol',
        name: 'Menthol',
        colors: {
            background: '#00c18c',
            foreground: '#ffffff',
            primary: '#ffffff',
            caret: '#99fdd8',
            sub: '#186544',
            subAlt: '#17ae7d',
            error: '#e03c3c'
        }
    },
    {
        id: 'metaverse',
        name: 'Metaverse',
        colors: {
            background: '#232323',
            foreground: '#e8e8e8',
            primary: '#d82934',
            caret: '#d82934',
            sub: '#5e5e5e',
            subAlt: '#1d1d1d',
            error: '#da3333'
        }
    },
    {
        id: 'metropolis',
        name: 'Metropolis',
        colors: {
            background: '#0f1f2c',
            foreground: '#e4edf1',
            primary: '#56c3b7',
            caret: '#56c3b7',
            sub: '#326984',
            subAlt: '#0b1822',
            error: '#d44729'
        }
    },
    {
        id: 'mexican',
        name: 'Mexican',
        colors: {
            background: '#f8ad34',
            foreground: '#eee',
            primary: '#b12189',
            caret: '#eee',
            sub: '#333',
            subAlt: '#f9b951',
            error: '#da3333'
        }
    },
    {
        id: 'miami',
        name: 'Miami',
        colors: {
            background: '#f35588',
            foreground: '#f0e9ec',
            primary: '#05dfd7',
            caret: '#a3f7bf',
            sub: '#94294c',
            subAlt: '#db4979',
            error: '#fff591'
        }
    },
    {
        id: 'miami_nights',
        name: 'Miami Nights',
        colors: {
            background: '#18181a',
            foreground: '#fff',
            primary: '#e4609b',
            caret: '#e4609b',
            sub: '#47bac0',
            subAlt: '#0f0f10',
            error: '#fff591'
        }
    },
    {
        id: 'midnight',
        name: 'Midnight',
        colors: {
            background: '#0b0e13',
            foreground: '#9fadc6',
            primary: '#60759f',
            caret: '#60759f',
            sub: '#394760',
            subAlt: '#141a24',
            error: '#c27070'
        }
    },
    {
        id: 'milkshake',
        name: 'Milkshake',
        colors: {
            background: '#ffffff',
            foreground: '#212b43',
            primary: '#212b43',
            caret: '#212b43',
            sub: '#62cfe6',
            subAlt: '#ddeff3',
            error: '#f19dac'
        }
    },
    {
        id: 'mint',
        name: 'Mint',
        colors: {
            background: '#05385b',
            foreground: '#edf5e1',
            primary: '#5cdb95',
            caret: '#5cdb95',
            sub: '#20688a',
            subAlt: '#07324e',
            error: '#f35588'
        }
    },
    {
        id: 'mizu',
        name: 'Mizu',
        colors: {
            background: '#afcbdd',
            foreground: '#1a2633',
            primary: '#fcfbf6',
            caret: '#fcfbf6',
            sub: '#85a5bb',
            subAlt: '#9fc1d4',
            error: '#bf616a'
        }
    },
    {
        id: 'modern_dolch',
        name: 'Modern Dolch',
        colors: {
            background: '#2d2e30',
            foreground: '#e3e6eb',
            primary: '#7eddd3',
            caret: '#7eddd3',
            sub: '#54585c',
            subAlt: '#242527',
            error: '#d36a7b'
        }
    },
    {
        id: 'modern_dolch_light',
        name: 'Modern Dolch Light',
        colors: {
            background: '#dbdbdb',
            foreground: '#454545',
            primary: '#8fd1c3',
            caret: '#8fd1c3',
            sub: '#a3a2a2',
            subAlt: '#e8e8e8',
            error: '#ea8a9a'
        }
    },
    {
        id: 'modern_ink',
        name: 'Modern Ink',
        colors: {
            background: '#ffffff',
            foreground: '#000000',
            primary: '#ff360d',
            caret: '#ff0000',
            sub: '#b7b7b7',
            subAlt: '#ececec',
            error: '#d70000'
        }
    },
    {
        id: 'monokai',
        name: 'Monokai',
        colors: {
            background: '#272822',
            foreground: '#e2e2dc',
            primary: '#a6e22e',
            caret: '#66d9ef',
            sub: '#e6db74',
            subAlt: '#1f201b',
            error: '#f92672'
        }
    },
    {
        id: 'moonlight',
        name: 'Moonlight',
        colors: {
            background: '#191f28',
            foreground: '#ccccb5',
            primary: '#c69f68',
            caret: '#8f744b',
            sub: '#4b5975',
            subAlt: '#141a22',
            error: '#b81b2c'
        }
    },
    {
        id: 'mountain',
        name: 'Mountain',
        colors: {
            background: '#0f0f0f',
            foreground: '#e7e7e7',
            primary: '#e7e7e7',
            caret: '#f5f5f5',
            sub: '#4c4c4c',
            subAlt: '#1a1a1a',
            error: '#ac8c8c'
        }
    },
    {
        id: 'mr_sleeves',
        name: 'Mr Sleeves',
        colors: {
            background: '#d1d7da',
            foreground: '#1d1d1d',
            primary: '#daa99b',
            caret: '#8fadc9',
            sub: '#9a9fa1',
            subAlt: '#bfcbd1',
            error: '#bf6464'
        }
    },
    {
        id: 'ms_cupcakes',
        name: 'Ms Cupcakes',
        colors: {
            background: '#ffffff',
            foreground: '#0a282f',
            primary: '#5ed5f3',
            caret: '#303030',
            sub: '#d64090',
            subAlt: '#edf8fa',
            error: '#a4dd32'
        }
    },
    {
        id: 'muted',
        name: 'Muted',
        colors: {
            background: '#525252',
            foreground: '#b1e4e3',
            primary: '#c5b4e3',
            caret: '#b1e4e3',
            sub: '#939eae',
            subAlt: '#494949',
            error: '#edc1cd'
        }
    },
    {
        id: 'nautilus',
        name: 'Nautilus',
        colors: {
            background: '#132237',
            foreground: '#1cbaac',
            primary: '#ebb723',
            caret: '#ebb723',
            sub: '#0b4c6c',
            subAlt: '#0e1a29',
            error: '#da3333'
        }
    },
    {
        id: 'nebula',
        name: 'Nebula',
        colors: {
            background: '#212135',
            foreground: '#838686',
            primary: '#be3c88',
            caret: '#78c729',
            sub: '#19b3b8',
            subAlt: '#191928',
            error: '#ca4754'
        }
    },
    {
        id: 'night_runner',
        name: 'Night Runner',
        colors: {
            background: '#212121',
            foreground: '#e8e8e8',
            primary: '#feff04',
            caret: '#feff04',
            sub: '#5c4a9c',
            subAlt: '#1a1a1a',
            error: '#da3333'
        }
    },
    {
        id: 'nord',
        name: 'Nord',
        colors: {
            background: '#242933',
            foreground: '#d8dee9',
            primary: '#88c0d0',
            caret: '#eceff4',
            sub: '#929aaa',
            subAlt: '#2e3440',
            error: '#bf616a'
        }
    },
    {
        id: 'nord_light',
        name: 'Nord Light',
        colors: {
            background: '#eceff4',
            foreground: '#8fbcbb',
            primary: '#8fbcbb',
            caret: '#8fbcbb',
            sub: '#6a7791',
            subAlt: '#d8dee9',
            error: '#bf616a'
        }
    },
    {
        id: 'norse',
        name: 'Norse',
        colors: {
            background: '#242425',
            foreground: '#ccc2b1',
            primary: '#2b5f6d',
            caret: '#2b5f6d',
            sub: '#505b5e',
            subAlt: '#303333',
            error: '#7e2a2a'
        }
    },
    {
        id: 'oblivion',
        name: 'Oblivion',
        colors: {
            background: '#313231',
            foreground: '#f7f5f1',
            primary: '#a5a096',
            caret: '#a5a096',
            sub: '#5d6263',
            subAlt: '#3a3b3b',
            error: '#dd452e'
        }
    },
    {
        id: 'olive',
        name: 'Olive',
        colors: {
            background: '#e9e5cc',
            foreground: '#373731',
            primary: '#92946f',
            caret: '#92946f',
            sub: '#b7b39e',
            subAlt: '#d4cfbc',
            error: '#cf2f2f'
        }
    },
    {
        id: 'olivia',
        name: 'Olivia',
        colors: {
            background: '#1c1b1d',
            foreground: '#f2efed',
            primary: '#deaf9d',
            caret: '#deaf9d',
            sub: '#4e3e3e',
            subAlt: '#262223',
            error: '#bf616a'
        }
    },
    {
        id: 'onedark',
        name: 'Onedark',
        colors: {
            background: '#2f343f',
            foreground: '#98c379',
            primary: '#61afef',
            caret: '#61afef',
            sub: '#eceff4',
            subAlt: '#262b34',
            error: '#e06c75'
        }
    },
    {
        id: 'our_theme',
        name: 'Our Theme',
        colors: {
            background: '#ce1226',
            foreground: '#ffffff',
            primary: '#fcd116',
            caret: '#fcd116',
            sub: '#6d0f19',
            subAlt: '#9f1020',
            error: '#fcd116'
        }
    },
    {
        id: 'pale_nimbus',
        name: 'Pale Nimbus',
        colors: {
            background: '#433e4c',
            foreground: '#feffdb',
            primary: '#94ffc2',
            caret: '#9efffd',
            sub: '#ffaca3',
            subAlt: '#694f5e',
            error: '#ff5c5c'
        }
    },
    {
        id: 'paper',
        name: 'Paper',
        colors: {
            background: '#eeeeee',
            foreground: '#444444',
            primary: '#444444',
            caret: '#444444',
            sub: '#b2b2b2',
            subAlt: '#dddddd',
            error: '#d70000'
        }
    },
    {
        id: 'passion_fruit',
        name: 'Passion Fruit',
        colors: {
            background: '#7c2142',
            foreground: '#ffffff',
            primary: '#f4a3b4',
            caret: '#ffffff',
            sub: '#9994b8',
            subAlt: '#833c5e',
            error: '#deb80b'
        }
    },
    {
        id: 'pastel',
        name: 'Pastel',
        colors: {
            background: '#e0b2bd',
            foreground: '#6d5c6f',
            primary: '#fbf4b6',
            caret: '#fbf4b6',
            sub: '#b4e9ff',
            subAlt: '#d29fab',
            error: '#ff6961'
        }
    },
    {
        id: 'peach_blossom',
        name: 'Peach Blossom',
        colors: {
            background: '#292929',
            foreground: '#fecea8',
            primary: '#99b898',
            caret: '#616161',
            sub: '#616161',
            subAlt: '#2a363b',
            error: '#ff6961'
        }
    },
    {
        id: 'peaches',
        name: 'Peaches',
        colors: {
            background: '#e0d7c1',
            foreground: '#5f4c41',
            primary: '#dd7a5f',
            caret: '#dd7a5f',
            sub: '#e7b28e',
            subAlt: '#e2caaf',
            error: '#ff6961'
        }
    },
    {
        id: 'phantom',
        name: 'Phantom',
        colors: {
            background: '#001',
            foreground: '#c0caf5',
            primary: '#7aa2f7',
            caret: '#bb9af7',
            sub: '#414868',
            subAlt: '#24283b',
            error: '#f7768e'
        }
    },
    {
        id: 'pink_lemonade',
        name: 'Pink Lemonade',
        colors: {
            background: '#f6d992',
            foreground: '#fcfcf8',
            primary: '#f6a192',
            caret: '#fcfcf8',
            sub: '#f6b092',
            subAlt: '#f6cc93',
            error: '#ff6f69'
        }
    },
    {
        id: 'pulse',
        name: 'Pulse',
        colors: {
            background: '#181818',
            foreground: '#e5f4f4',
            primary: '#17b8bd',
            caret: '#17b8bd',
            sub: '#53565a',
            subAlt: '#121212',
            error: '#da3333'
        }
    },
    {
        id: 'purpleish',
        name: 'Purpleish',
        colors: {
            background: '#1e1e32',
            foreground: '#a3a3cc',
            primary: '#7a52cc',
            caret: '#7a52cc',
            sub: '#5c5c99',
            subAlt: '#181829',
            error: '#ff6666'
        }
    },
    {
        id: 'rainbow_trail',
        name: 'Rainbow Trail',
        colors: {
            background: '#f5f5f5',
            foreground: '#1f1f1f',
            primary: '#363636',
            caret: '#0d0d0d',
            sub: '#4f4f4f',
            subAlt: '#e0e0e0',
            error: '#ff0008'
        }
    },
    {
        id: 'red_dragon',
        name: 'Red Dragon',
        colors: {
            background: '#1a0b0c',
            foreground: '#4a4d4e',
            primary: '#ff3a32',
            caret: '#ff3a32',
            sub: '#e2a528',
            subAlt: '#0e0506',
            error: '#771b1f'
        }
    },
    {
        id: 'red_samurai',
        name: 'Red Samurai',
        colors: {
            background: '#84202c',
            foreground: '#e2dad0',
            primary: '#c79e6e',
            caret: '#c79e6e',
            sub: '#55131b',
            subAlt: '#751d26',
            error: '#33bbda'
        }
    },
    {
        id: 'repose_dark',
        name: 'Repose Dark',
        colors: {
            background: '#2f3338',
            foreground: '#d6d2bc',
            primary: '#d6d2bc',
            caret: '#d6d2bc',
            sub: '#8f8e84',
            subAlt: '#3a3c3d',
            error: '#ff4a59'
        }
    },
    {
        id: 'repose_light',
        name: 'Repose Light',
        colors: {
            background: '#efead0',
            foreground: '#333538',
            primary: '#5f605e',
            caret: '#5f605e',
            sub: '#8f8e84',
            subAlt: '#dbd6c4',
            error: '#c43c53'
        }
    },
    {
        id: 'retro',
        name: 'Retro',
        colors: {
            background: '#dad3c1',
            foreground: '#1d1b17',
            primary: '#1d1b17',
            caret: '#1d1b17',
            sub: '#918b7d',
            subAlt: '#c8c3b3',
            error: '#bf616a'
        }
    },
    {
        id: 'retrocast',
        name: 'Retrocast',
        colors: {
            background: '#07737a',
            foreground: '#ffffff',
            primary: '#88dbdf',
            caret: '#88dbdf',
            sub: '#f3e03b',
            subAlt: '#26858b',
            error: '#ff585d'
        }
    },
    {
        id: 'rgb',
        name: 'Rgb',
        colors: {
            background: '#111',
            foreground: '#eee',
            primary: '#eee',
            caret: '#eee',
            sub: '#444',
            subAlt: '#1a1a1a',
            error: '#eee'
        }
    },
    {
        id: 'rose_pine',
        name: 'Rose Pine',
        colors: {
            background: '#1f1d27',
            foreground: '#e0def4',
            primary: '#9ccfd8',
            caret: '#f6c177',
            sub: '#c4a7e7',
            subAlt: '#282533',
            error: '#eb6f92'
        }
    },
    {
        id: 'rose_pine_dawn',
        name: 'Rose Pine Dawn',
        colors: {
            background: '#fffaf3',
            foreground: '#286983',
            primary: '#56949f',
            caret: '#ea9d34',
            sub: '#c4a7e7',
            subAlt: '#f0e9df',
            error: '#b4637a'
        }
    },
    {
        id: 'rose_pine_moon',
        name: 'Rose Pine Moon',
        colors: {
            background: '#2a273f',
            foreground: '#e0def4',
            primary: '#9ccfd8',
            caret: '#f6c177',
            sub: '#c4a7e7',
            subAlt: '#211f32',
            error: '#eb6f92'
        }
    },
    {
        id: 'rudy',
        name: 'Rudy',
        colors: {
            background: '#1a2b3e',
            foreground: '#c9c8bf',
            primary: '#af8f5c',
            caret: '#af8f5c',
            sub: '#3a506c',
            subAlt: '#152231',
            error: '#bf616a'
        }
    },
    {
        id: 'ryujinscales',
        name: 'Ryujinscales',
        colors: {
            background: '#081426',
            foreground: '#ffe4bc',
            primary: '#f17754',
            caret: '#ef6d49',
            sub: '#ffbc90',
            subAlt: '#040e1d',
            error: '#ca4754'
        }
    },
    {
        id: 'serika',
        name: 'Serika',
        colors: {
            background: '#e1e1e3',
            foreground: '#323437',
            primary: '#e2b714',
            caret: '#e2b714',
            sub: '#aaaeb3',
            subAlt: '#d1d3d8',
            error: '#da3333'
        }
    },
    {
        id: 'serika_dark',
        name: 'Serika Dark',
        colors: {
            background: '#323437',
            foreground: '#d1d0c5',
            primary: '#e2b714',
            caret: '#e2b714',
            sub: '#646669',
            subAlt: '#2c2e31',
            error: '#ca4754'
        }
    },
    {
        id: 'sewing_tin',
        name: 'Sewing Tin',
        colors: {
            background: '#241963',
            foreground: '#ffffff',
            primary: '#f2ce83',
            caret: '#fbdb8c',
            sub: '#446ad5',
            subAlt: '#2a277a',
            error: '#c6915e'
        }
    },
    {
        id: 'sewing_tin_light',
        name: 'Sewing Tin Light',
        colors: {
            background: '#ffffff',
            foreground: '#2d2076',
            primary: '#2d2076',
            caret: '#fbdb8c',
            sub: '#385eca',
            subAlt: '#c8cedf',
            error: '#f2ce83'
        }
    },
    {
        id: 'shadow',
        name: 'Shadow',
        colors: {
            background: '#000',
            foreground: '#eee',
            primary: '#eee',
            caret: '#eee',
            sub: '#444',
            subAlt: '#171717',
            error: '#fff'
        }
    },
    {
        id: 'shoko',
        name: 'Shoko',
        colors: {
            background: '#ced7e0',
            foreground: '#3b4c58',
            primary: '#81c4dd',
            caret: '#81c4dd',
            sub: '#7599b1',
            subAlt: '#b7cada',
            error: '#bf616a'
        }
    },
    {
        id: 'slambook',
        name: 'Slambook',
        colors: {
            background: '#fffdde',
            foreground: '#13005a',
            primary: '#03001c',
            caret: '#367e18',
            sub: '#1c82adc4',
            subAlt: '#c6dce4',
            error: '#f900bf'
        }
    },
    {
        id: 'snes',
        name: 'Snes',
        colors: {
            background: '#bfbec2',
            foreground: '#2e2e2e',
            primary: '#553d94',
            caret: '#523793',
            sub: '#9f8ad4',
            subAlt: '#b5b0c2',
            error: '#ca4754'
        }
    },
    {
        id: 'soaring_skies',
        name: 'Soaring Skies',
        colors: {
            background: '#fff9f2',
            foreground: '#1d1e1e',
            primary: '#55c6f0',
            caret: '#1e107a',
            sub: '#1e107a',
            subAlt: '#e5ddd4',
            error: '#fb5745'
        }
    },
    {
        id: 'solarized_dark',
        name: 'Solarized Dark',
        colors: {
            background: '#002b36',
            foreground: '#268bd2',
            primary: '#859900',
            caret: '#dc322f',
            sub: '#2aa198',
            subAlt: '#00222b',
            error: '#d33682'
        }
    },
    {
        id: 'solarized_light',
        name: 'Solarized Light',
        colors: {
            background: '#fdf6e3',
            foreground: '#181819',
            primary: '#859900',
            caret: '#dc322f',
            sub: '#2aa198',
            subAlt: '#e2d8be',
            error: '#d33682'
        }
    },
    {
        id: 'solarized_osaka',
        name: 'Solarized Osaka',
        colors: {
            background: '#00141a',
            foreground: '#eee8d5',
            primary: '#859900',
            caret: '#b58900',
            sub: '#2aa198',
            subAlt: '#00222b',
            error: '#dc322f'
        }
    },
    {
        id: 'sonokai',
        name: 'Sonokai',
        colors: {
            background: '#2c2e34',
            foreground: '#e2e2e3',
            primary: '#9ed072',
            caret: '#f38c71',
            sub: '#e7c664',
            subAlt: '#232429',
            error: '#fc5d7c'
        }
    },
    {
        id: 'spiderman',
        name: 'Spiderman',
        colors: {
            background: '#0d1219',
            foreground: '#f0f0f0',
            primary: '#e23636',
            caret: '#e23636',
            sub: '#0476f2',
            subAlt: '#0b1c2e',
            error: '#0476f2'
        }
    },
    {
        id: 'stealth',
        name: 'Stealth',
        colors: {
            background: '#010203',
            foreground: '#383e42',
            primary: '#383e42',
            caret: '#e25303',
            sub: '#5e676e',
            subAlt: '#121212',
            error: '#e25303'
        }
    },
    {
        id: 'strawberry',
        name: 'Strawberry',
        colors: {
            background: '#f37f83',
            foreground: '#fcfcf8',
            primary: '#fcfcf8',
            caret: '#fcfcf8',
            sub: '#e53c58',
            subAlt: '#ef6e77',
            error: '#fcd23f'
        }
    },
    {
        id: 'striker',
        name: 'Striker',
        colors: {
            background: '#124883',
            foreground: '#d6dbd9',
            primary: '#d7dcda',
            caret: '#d7dcda',
            sub: '#0f2d4e',
            subAlt: '#104176',
            error: '#fb4934'
        }
    },
    {
        id: 'suisei',
        name: 'Suisei',
        colors: {
            background: '#3b4a62',
            foreground: '#dbdeeb',
            primary: '#bef0ff',
            caret: '#bef0ff',
            sub: '#fe9841',
            subAlt: '#313e55',
            error: '#ed2939'
        }
    },
    {
        id: 'sunset',
        name: 'Sunset',
        colors: {
            background: '#211e24',
            foreground: '#f4e0c9',
            primary: '#f79777',
            caret: '#ffca99',
            sub: '#5b578e',
            subAlt: '#161319',
            error: '#66a1ff'
        }
    },
    {
        id: 'superuser',
        name: 'Superuser',
        colors: {
            background: '#262a33',
            foreground: '#e5f7ef',
            primary: '#43ffaf',
            caret: '#43ffaf',
            sub: '#526777',
            subAlt: '#1f232c',
            error: '#ff5f5f'
        }
    },
    {
        id: 'sweden',
        name: 'Sweden',
        colors: {
            background: '#0058a3',
            foreground: '#ffffff',
            primary: '#ffcc02',
            caret: '#b5b5b5',
            sub: '#57abdb',
            subAlt: '#024f8e',
            error: '#e74040'
        }
    },
    {
        id: 'tangerine',
        name: 'Tangerine',
        colors: {
            background: '#ffede0',
            foreground: '#3d1705',
            primary: '#fe5503',
            caret: '#5d8500',
            sub: '#ff9562',
            subAlt: '#fdd3bf',
            error: '#7fb500'
        }
    },
    {
        id: 'taro',
        name: 'Taro',
        colors: {
            background: 'linear-gradient(215deg, #cbb8ba, #706768)',
            foreground: '#130f1a',
            primary: '#130f1a',
            caret: '#00e9e5',
            sub: '#6f6c91',
            subAlt: '#a3a7df',
            error: '#ffe23e'
        }
    },
    {
        id: 'terminal',
        name: 'Terminal',
        colors: {
            background: '#191a1b',
            foreground: '#e7eae0',
            primary: '#79a617',
            caret: '#79a617',
            sub: '#48494b',
            subAlt: '#141516',
            error: '#a61717'
        }
    },
    {
        id: 'terra',
        name: 'Terra',
        colors: {
            background: '#0c100e',
            foreground: '#f0edd1',
            primary: '#89c559',
            caret: '#89c559',
            sub: '#436029',
            subAlt: '#0f1d18',
            error: '#d3ca78'
        }
    },
    {
        id: 'terrazzo',
        name: 'Terrazzo',
        colors: {
            background: '#f1e5da',
            foreground: '#023e3b',
            primary: '#e0794e',
            caret: '#e0794e',
            sub: '#688e8f',
            subAlt: '#e3d3c6',
            error: '#a01034'
        }
    },
    {
        id: 'terror_below',
        name: 'Terror Below',
        colors: {
            background: '#0b1e1a',
            foreground: '#dceae5',
            primary: '#66ac92',
            caret: '#66ac92',
            sub: '#015c53',
            subAlt: '#041715',
            error: '#bf616a'
        }
    },
    {
        id: 'tiramisu',
        name: 'Tiramisu',
        colors: {
            background: '#cfc6b9',
            foreground: '#7d5448',
            primary: '#c0976f',
            caret: '#7d5448',
            sub: '#c0976f',
            subAlt: '#d0bca7',
            error: '#e9632d'
        }
    },
    {
        id: 'trackday',
        name: 'Trackday',
        colors: {
            background: '#464d66',
            foreground: '#cfcfcf',
            primary: '#e0513e',
            caret: '#475782',
            sub: '#5c7eb9',
            subAlt: '#3d4359',
            error: '#e44e4e'
        }
    },
    {
        id: 'trance',
        name: 'Trance',
        colors: {
            background: '#00021b',
            foreground: '#fff',
            primary: '#e51376',
            caret: '#e51376',
            sub: '#3c4c79',
            subAlt: '#18214c',
            error: '#02d3b0'
        }
    },
    {
        id: 'tron_orange',
        name: 'Tron Orange',
        colors: {
            background: '#0d1c1c',
            foreground: '#ffffff',
            primary: '#f0e800',
            caret: '#f0e800',
            sub: '#ff6600',
            subAlt: '#9c9191',
            error: '#ff0000'
        }
    },
    {
        id: 'vaporwave',
        name: 'Vaporwave',
        colors: {
            background: '#a4a7ea',
            foreground: '#f1ebf1',
            primary: '#e368da',
            caret: '#28cafe',
            sub: '#7c7faf',
            subAlt: '#989bd9',
            error: '#573ca9'
        }
    },
    {
        id: 'vesper',
        name: 'Vesper',
        colors: {
            background: '#101010',
            foreground: '#ffffff',
            primary: '#ffc799',
            caret: '#99ffe4',
            sub: '#a0a0a0',
            subAlt: '#1c1c1c',
            error: '#ff8080'
        }
    },
    {
        id: 'vesper_light',
        name: 'Vesper Light',
        colors: {
            background: '#ffffff',
            foreground: '#000000',
            primary: '#fb7100',
            caret: '#067a6e',
            sub: '#a0a0a0',
            subAlt: '#fff8f4',
            error: '#ed2839'
        }
    },
    {
        id: 'viridescent',
        name: 'Viridescent',
        colors: {
            background: '#2c3333',
            foreground: '#e9f5db',
            primary: '#95d5b2',
            caret: '#f0d3c9',
            sub: '#84a98c',
            subAlt: '#232828',
            error: '#ff4646'
        }
    },
    {
        id: 'voc',
        name: 'Voc',
        colors: {
            background: '#190618',
            foreground: '#eeeae4',
            primary: '#e0caac',
            caret: '#e0caac',
            sub: '#4c1e48',
            subAlt: '#2c0c28',
            error: '#af3735'
        }
    },
    {
        id: 'vscode',
        name: 'Vscode',
        colors: {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            primary: '#007acc',
            caret: '#569cd6',
            sub: '#4d4d4d',
            subAlt: '#191919',
            error: '#f44747'
        }
    },
    {
        id: 'watermelon',
        name: 'Watermelon',
        colors: {
            background: '#1f4437',
            foreground: '#cdc6bc',
            primary: '#d6686f',
            caret: '#d6686f',
            sub: '#3e7a65',
            subAlt: '#244d3f',
            error: '#c82931'
        }
    },
    {
        id: 'wavez',
        name: 'Wavez',
        colors: {
            background: '#1c292f',
            foreground: '#e9efe6',
            primary: '#6bde3b',
            caret: '#6bde3b',
            sub: '#1f5e6b',
            subAlt: '#1b3238',
            error: '#ca4754'
        }
    },
    {
        id: 'witch_girl',
        name: 'Witch Girl',
        colors: {
            background: '#f3dbda',
            foreground: '#56786a',
            primary: '#56786a',
            caret: '#afc5bd',
            sub: '#ddb4a7',
            subAlt: '#e7c8be',
            error: '#b29a91'
        }
    }
];
