let slow = false;
const numSets = 32;
const numWays = 12;
const numAddr = numSets * numWays;
const numExeTimeRecord = 1000;
const colorMap = new Map();
colorMap.set('attacker', 'red');
colorMap.set('ct-swap', 'green');
let cache = Array.from({ length: numSets }, () => []);
let attackOn = false;
const exeTimeRecords = [];
var chart = echarts.init(document.getElementById('chart'));
const chartOption = {
    color: [
        '#ff5555',
        '#ffffff'
    ],
    title: {
        text: "Cache Access Time"
    },
    
    xAxis: {
        type: 'category',
        axisLine: {
            lineStyle: {
                color: "#000000"
            }
        },
    },
    yAxis: {
        type: 'value',
        axisLine: {
            lineStyle: {
                color: "#000000"
            }
        },
    },
    series: [
      {
        data: exeTimeRecords,
        type: 'line',
        areaStyle: {}
      }
    ]
};

const a = [0, 0, 0, 0, 0];
const b = [0, 0, 0, 0, 0];
const numStart = 0x0000;
const numRange = 0x0fff;
const addrStart = 0x1000;
const addrRange = 0xefff;
const elementsA = [0, 0, 0, 0, 0];
const elementsB = [0, 0, 0, 0, 0];

function randomValue(start, range) {
    return start + Math.floor(Math.random() * range);
}

function randomNumber(array) {
    for (let i = 0; i < array.length; i++) {
        array[i] = randomValue(numStart, numRange);
    }
}

function randomAddr(array) {
    for (let i = 0; i < array.length; i++) {
        array[i] = randomValue(addrStart, addrRange);
    }
}

function displayArrayA() {
    const arrayA = document.getElementById('array-a-elements');
    arrayA.innerHTML = '';
    for (let i = 0; i < a.length; i++) {
        const element = document.createElement('div');
        element.classList.add('array-box');
        element.classList.add('array-element');
        if (isAddr(a[i])) {
            element.classList.add('wait-scan');
        }
        element.innerText = decToHex(a[i], 4);
        arrayA.appendChild(element);
        elementsA[i] = element;
    }
    activateDMPonA();

}

function displayArrayB() {
    const arrayB = document.getElementById('array-b-elements');

    arrayB.innerHTML = '';

    for (let i = 0; i < b.length; i++) {
        const element = document.createElement('div');
        element.classList.add('array-box');
        element.classList.add('array-element');
        if (isAddr(b[i])) {
            element.classList.add('wait-scan');
        }
        element.innerText = decToHex(b[i], 4);
        arrayB.appendChild(element);
        elementsB[i] = element;
    }
    activateDMPonB();
}

function displayArray() {
    displayArrayA();
    displayArrayB();
}

async function activateDMPonA() {
    for (let i = 0; i < a.length; i++) {
        if (isAddr(a[i])) {
            elementsA[i].classList.add('dmp-on');
            await sleep(10);
            elementsA[i].classList.remove('dmp-on');
            elementsA[i].classList.add('dmp-over');
            addToCache({
                value: a[i],
                source: 'ct-swap',
                update: 1
            });
        }
    }
}

async function activateDMPonB() {
    for (let i = 0; i < b.length; i++) {
        if (isAddr(b[i])) {
            elementsB[i].classList.add('dmp-on');
            await sleep(10);
            elementsB[i].classList.remove('dmp-on');
            elementsB[i].classList.add('dmp-over');
            addToCache({
                value: b[i],
                source: 'ct-swap',
                update: 1
            });
        }
    }
}

async function activateDMP() {
    activateDMPonA();
    activateDMPonB();
}

function swap() {

    for (let i = 0; i < a.length; i++) {
        const temp = a[i];
        a[i] = b[i];
        b[i] = temp;

    }
    displayArray();
}

function isAddr(value) {
    return value >= addrStart && value < (addrStart + addrRange);
}

async function addToCache(input) {
    const setIndex = hashFunction(input.value);

    const set = cache[setIndex];
    let wayIndex = -1;
    for (let i = 0; i < set.length; i++) {
        if (set[i].value == input.value) {
            wayIndex = i;
            break;
        }
    }

    if (wayIndex !== -1) {
        // Cache Hit
        // 将访问元素移到最后一位
        set.splice(wayIndex, 1);

        set.push({
            value: input.value,
            source: input.source,
            update: 1
        });

        updateCacheDisplay();

    } else {
        // Cache Miss

        set.push({
            value: input.value,
            source: input.source,
            update: 1
        });

        while (set.length > numWays) {
            // Cache内存不足
            // 删除最不常用的元素
            set.shift();
        }

        updateCacheDisplay();

        await sleep(10);
    }

}

function hashFunction(input) {
    // Simple hash function to distribute items among sets
    return Math.abs(input % numSets);
}

function updateCacheDisplay() {
    const cacheDisplay = document.getElementById('cache-display');
    cacheDisplay.innerHTML = '';
    cache.forEach((set, setIndex) => {
        const setDiv = document.createElement('div');
        setDiv.className = 'cache-set';
        const setTitle = document.createElement('h3');
        setTitle.innerText = `${decToHex(setIndex, 2)}`;
        setDiv.appendChild(setTitle);
        const boxDiv = document.createElement('div');
        boxDiv.className = 'cache-box';
        set.forEach(line => {
            const lineDiv = document.createElement('div');
            lineDiv.classList.add('cache-line');
            if (line.update == 1) {
                lineDiv.classList.add('light-' + colorMap.get(line.source));
                line.update = 0;
            } else {
                lineDiv.classList.add(colorMap.get(line.source));
            }
            boxDiv.appendChild(lineDiv);
        });
        setDiv.appendChild(boxDiv);
        cacheDisplay.appendChild(setDiv);
    });
}

function decToHex(decimal, width) {
    if (decimal < 0) {
        decimal = 0xFFFFFFFF + decimal + 1;
    }
    str = decimal.toString(16).toUpperCase();
    while (str.length < width) {
        str = '0' + str;
    }
    return '0x' + str;
}

function getRandomSource() {
    let ran = Math.random();
    if (ran < 0.5) {
        return 'attacker';
    } else {
        return 'ct-swap';
    }
}

function sleep(ms) {
    if (slow == true) {
        ms *= 100;
    }
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateChart() {
    chart.setOption(chartOption);
}

function getRandomNumber(bound) {
    return Math.floor(Math.random() * bound);
}

async function ranAcc(times) {
    for (let i = 0; i < times; i++) {
        await addToCache({
            value: numAddr + getRandomNumber(numAddr),
            source: 'ct-swap'
        });
    }
}

function setValue() {
    randomNumber(a);
    randomAddr(b);
    displayArray();
}

function setNumberA() {
    randomNumber(a);
    displayArrayA();
}

function setNumberB() {
    randomNumber(b);
    displayArrayB();
}

function setPointerA() {
    randomAddr(a);
    displayArrayA();
}

function setPointerB() {
    randomAddr(b);
    displayArrayB();
}

function refreshCache() {
    for (let i = 0; i < numSets; i++) {
        cache[i] = [];
    }
    updateCacheDisplay();
}

async function main() {
    var switchButton1 = document.querySelector('.attack-switch input');
    switchButton1.addEventListener('change', function() {
        if (this.checked) {
            attackOn = true;
        } else {
            attackOn = false;
        }
    });

    var switchButton2 = document.querySelector('#slow-switch input');
    switchButton2.addEventListener('change', function() {
        if (this.checked) {
            slow = true;
        } else {
            slow = false;
        }
    });

    updateCacheDisplay();


    let i = -1;
    let max = 0;
    let loop = 0;

    while (true) {

        if (attackOn) {

            const startTime = new Date();

            i = (i + 1) % numAddr;
            await addToCache({
                value: i,
                source: "attacker"
            })

            const endTime = new Date();

            let duration = endTime - startTime;
            if (slow == true) {
                duration = Math.ceil(duration / 100);
            }
            if (duration > max && duration < 20) max = duration;
            loop += 1;

            if (loop == 10) {
                if (exeTimeRecords.length >= numExeTimeRecord) {
                    exeTimeRecords.shift();
                }
                exeTimeRecords.push(max);
                updateChart();     
                loop = 0;
                max = 0;     
            }
        }

        await sleep(1);
    }
}


main();