import { Flashcard } from './structures/flashcard';
import { ExerciseService } from './exercise.service';
import { Router } from '@angular/router';
import { Lesson } from './structures/lesson';

export abstract class Exercise {

    protected timeout = 1000;

    protected score: number = 0;

    protected vocabulary: Flashcard[];

    protected queue: Flashcard[];
    protected correctWords: Flashcard[];
    protected incorrectWords: Flashcard[];
    protected allWords: Flashcard[];

    protected currentWord: Flashcard;

    protected progress: number;

    protected timeInSeconds: number;
    protected timer: number;

    protected round: number;

    protected mcOptions;

    constructor(protected exerciseService: ExerciseService,
                protected router: Router) {
        this.exerciseService.setVocabulary([]);
        this.exerciseService.clearResults();

        this.queue = [];
        this.correctWords = [];
        this.incorrectWords = [];
        this.allWords = [];

        this.currentWord = new Flashcard;
        this.progress = 0;

        this.timeInSeconds = 0;
        this.round = 0;
    }

    protected initialize(lesson: Lesson): void {
        for (let word of this.exerciseService.getVocabulary().sort((a, b) => 0.5 - Math.random()))
            this.queue.push(word);
        this.allWords = this.queue.slice(0);
        this.currentWord = this.queue[0];
        this.addOptions(this.currentWord);

        this.startTimer();

        this.exerciseService.setLesson(lesson);
    }

    protected hasNext(): boolean {
        return this.queue.length !== 0;
    }

    protected next(): void {
        if (this.hasNext()){
            console.log('1')
            this.currentWord = this.queue[0];
            this.addOptions(this.currentWord)
        }
        else if (this.incorrectWords.length > 0){
            console.log('2')
            this.nextRound();
        }
        else{
            console.log('3')
            this.exit();
        }
        console.log(this.queue)
    }

    private updateProgress(): void {
        this.progress = (this.correctWords.length / this.exerciseService.getVocabulary().length) * 100;
    }

    protected isCorrect(input: string): boolean {
        console.log('Nr 1 in queue ' + this.queue[0].translation )
        return input === this.queue[0].translation;
    }

    protected getCorrectValue(){
        return this.queue[0].translation;
    }

    protected clear(isCorrect: boolean, input: HTMLInputElement): boolean {
        if (!this.hasNext())
            return false;

        if (isCorrect) {
            this.currentWord.roundCorrect = this.round;
            this.exerciseService.addCorrectWord(this.currentWord);
        }

        (isCorrect ? this.correctWords : this.incorrectWords).push(this.queue[0]);
        this.queue.shift();
        console.log(this.queue)

        this.updateProgress();

        if (input !== null)
            input.value = '';

        return true;
    }

    protected nextRound(): void {
        this.queue = this.incorrectWords.slice().sort((a, b) => 0.5 - Math.random());
        this.incorrectWords = [];

        if (this.queue.length > 0)
            this.next();

        this.round++;
    }

    protected getTimeout(isCorrect: boolean): number {
        return this.timeout * (isCorrect ? 1 : 2);
    }

    protected startTimer(): void {
        let startingTime = new Date();

        this.timer = window.setInterval(() => {
            this.timeInSeconds = Math.floor((new Date().getTime() - startingTime.getTime()) / 1000);
        }, 1000);
    }

    protected stopTimer(): void {
        window.clearInterval(this.timer);
    }

    protected resetTimer(): void {
        this.timeInSeconds = 0;
    }

    protected calculateGrade(): void {
        let correctInFirstAttempt = 0;
        let pointsPerWord = 9 / this.exerciseService.getVocabulary().length;

        for (let word of this.exerciseService.getResults().vocabulary)
            if (word.roundCorrect === 0)
                correctInFirstAttempt++;

        this.exerciseService.setGrade(1 + pointsPerWord * correctInFirstAttempt);
    }

    protected exit(): void {
        this.calculateGrade();
        this.exerciseService.setLessonTime(this.timeInSeconds);
        this.exerciseService.setExerciseMethod('Flashcards');

        this.stopTimer();
        this.router.navigate(['/user/exercisecompleted']);
    }

    protected addOptions(word: Flashcard){
        var options = [this.queue[0].translation,];

        for(let i = 0; i < 3; i++){
            var rand = this.allWords[Math.floor(Math.random() * this.allWords.length)].translation;
            while(options.includes(rand)){
                rand = this.allWords[Math.floor(Math.random() * this.allWords.length)].translation;
            }
            options.push(rand);
        }
        word.options = options.sort((a, b) => 0.5 - Math.random());
    }
}
