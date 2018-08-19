interface ProduceduralSampleParams {
  biquadType: BiquadFilterType;
  biquadQ: number;
  frequency: number;
  gainParams: number[];
  volume: number;
}

const SAMPLES_PARAMS: {[key: string]: ProduceduralSampleParams} = {
  shootPistol: {
    biquadType: 'lowpass',
    biquadQ: 1,
    frequency: 1000,
    gainParams: [0, 0, 1, 0.001, 0.3, 0.101, 0, 0.5],
    volume: 1,
  },
  shootMG: {
    biquadType: 'lowpass',
    biquadQ: 1,
    frequency: 1300,
    gainParams: [0, 0, 1, 0.001, 0.3, 0.101, 0, 0.5],
    volume: 0.9,
  },
  shootMinigun: {
    biquadType: 'lowpass',
    biquadQ: 5,
    frequency: 1700,
    gainParams: [0, 0, 1, 0.001, 0.3, 0.101, 0, 0.4],
    volume: 0.2,
  },
  stoneStep1: {
    biquadType: 'lowpass',
    biquadQ: 1,
    frequency: 300,
    gainParams: [0, 0, 1, 0.001, 0.3, 0.101, 0, 0.2],
    volume: 0.5,
  },
  stoneStep2: {
    biquadType: 'lowpass',
    biquadQ: 1,
    frequency: 200,
    gainParams: [0, 0, 1, 0.001, 0.3, 0.101, 0, 0.2],
    volume: 0.5,
  },
  woodStep1: {
    biquadType: 'lowpass',
    biquadQ: 1,
    frequency: 550,
    gainParams: [0, 0, 1, 0.001, 0.3, 0.151, 0, 0.2],
    volume: 0.3,
  },
  woodStep2: {
    biquadType: 'lowpass',
    biquadQ: 1,
    frequency: 650,
    gainParams: [0, 0, 1, 0.001, 0.3, 0.151, 0, 0.2],
    volume: 0.3,
  },
};

const VOICE_COUNT = 5;

class WhiteNoiseGenerated {

  node: AudioBufferSourceNode;

  constructor(context: AudioContext) {
    var lengthInSamples = 5 * context.sampleRate;
    var buffer = context.createBuffer(1, lengthInSamples, context.sampleRate);
    var data = buffer.getChannelData(0);

    for (var i = 0; i < lengthInSamples; i++) {
      data[i] = ((Math.random() * 2) - 1);
    }

    this.node = context.createBufferSource();
    this.node.buffer = buffer;
    this.node.loop = true;
    this.node.start();
  }

  connect(dest: AudioNode) {
    this.node.connect(dest);
  }
}

class Envelope {

  node: GainNode;

  constructor(private context: AudioContext, private gainParams: number[]) {
    this.node = context.createGain();
    this.node.gain.value = 0;
  }

  addEventToQueue() {
    for (let i = 0; i < this.gainParams.length; i += 2) {
      this.node.gain.linearRampToValueAtTime(
        this.gainParams[i],
        this.context.currentTime + this.gainParams[i + 1],
      );
    }
  }

  connect(dest: AudioNode) {
    this.node.connect(dest);
  }
};

class ProceduralSample {

  voices: Envelope[] = [];

  voiceIndex = 0;

  noise: WhiteNoiseGenerated;

  masterNode: GainNode;

  constructor(
    private context: AudioContext,
    private params: ProduceduralSampleParams,
  ) {
    this.noise = new WhiteNoiseGenerated(this.context);
    this.makeSample();
  }

  play() {
    this.voiceIndex = (this.voiceIndex + 1) % VOICE_COUNT;
    this.voices[this.voiceIndex].addEventToQueue();
  }

  makeSample() {
    const filter = this.context.createBiquadFilter();
    filter.type = this.params.biquadType;
    filter.Q.value = this.params.biquadQ;
    filter.frequency.value = this.params.frequency;

    for (var i = 0; i < VOICE_COUNT; i++) {
      var voice = new Envelope(this.context, this.params.gainParams);
      this.noise.connect(voice.node);
      voice.connect(filter);
      this.voices.push(voice);
    }

    this.masterNode = this.context.createGain();
    this.masterNode.gain.value = this.params.volume;
    filter.connect(this.masterNode);
    this.masterNode.connect(this.context.destination);
  }
}

export class Sound {

  private context = new AudioContext();

  private samples: {[key: string]: ProceduralSample} = {};

  constructor() {
    for (const [name, params] of Object.entries(SAMPLES_PARAMS)) {
      this.samples[name] = new ProceduralSample(this.context, params);
    }
  }

  play(sample: string) {
    this.samples[sample].play();
  }

}

