import { Component, OnInit } from '@angular/core';
import {Board, PlayableBoard} from "../../assets/js/board";
import { Router } from "@angular/router";
import { UserService } from "../services/user.service";
import { SocketioService } from "../services/socketio.service";
import { Match, MatchService } from "../services/match.service";
import {skipUntil} from "rxjs/operators";
import {Chat, ChatService} from "../services/chat.service";

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.css']
})
export class MatchComponent implements OnInit {

  match: Match;
  board;
  username0: string;
  username1: string;
  canViewMessages: boolean = false;
  matchChat: Chat = null;
  isReplaying = false;
  isAutoReplaying = false;
  private replayStep = 0;

  constructor(private router: Router, private ms: MatchService, public userService: UserService,
              private ios: SocketioService, private chatService: ChatService) { }

  ngOnInit(): void {
    // get matchID from url
    let matchID = this.router.url.split('/').pop();

    if (this.userService.isLoggedIn)
      this.canViewMessages = true;

    // fetch chat
    this.chatService.getChatByMatch(matchID).subscribe((data) => {
      this.matchChat = data;
      // this.matchChat.messages = [];
      // this.fetchChat()
    })

    // get match from DB and determine user's relationship with it (player/watcher)
    this.ms.getMatchById(matchID).subscribe( data => {
      this.match = data;
      let isPlayer = this.userService.isLoggedIn && (this.userService.email === this.match.player0 || this.userService.email === this.match.player1)
      let playerTurn = isPlayer && this.userService.email === this.match.player0 ? 0 : isPlayer && this.userService.email === this.match.player1 ? 1 : null

      this.username0 = this.match.player0; //Provide a value before fetch
      this.username1 = this.match.player1;
      this.userService.get_user_by_mail(this.match.player0).subscribe(data => this.username0 = data.username);
      this.userService.get_user_by_mail(this.match.player1).subscribe(data => this.username1 = data.username);

      // connect to socketIo
      this.ios.connect(matchID, isPlayer).subscribe((message)=>{
        let subject = message.subject;
        // to execute when one player makes a new move
        if (subject === 'newMove') {
          this.match.turn = (this.match.turn + 1) % 2;
          if (!isPlayer || message.player !== this.userService.email) {
            this.board.insertDisk(message.column, (message.player === this.match.player0 ? 0 : 1));
          }
        }
        // to execute when the match ends
        if (subject === 'matchEnded') {
          this.ms.getMatchById(this.match._id).subscribe((m: Match) => {
            this.match.moves = m.moves;
          });
          this.match.winner.player = message.win.player;
          this.match.winner.positions = message.win.positions;
          this.board.endMatch();
          this.board.highlightVictory(message.win.positions)
        }
        // to execute when a new message is sent
        if (message.subject === 'newMessageReceived')
          this.matchChat.fetchChat();

      });

      // create the board (playable or not) based on the user relationship with the match
      if (isPlayer && this.match.winner.player === null){
        this.board = new PlayableBoard('#board', this.match.board,this.match.turn, playerTurn, (c)=>{
          this.makeMove(c);
        });
      }
      else {
        this.board = new Board('#board', this.match.board);
        this.board.highlightVictory(this.match.winner.positions)
      }

    });
  }

  // adds a disk on db. If successful, changes the turn
  makeMove(column): void {
    this.ms.placeDisk(this.match._id, this.userService.email, column).subscribe(
      ()=>{
        this.board.changeTurn()
        this.board.onDBUpdate();
      });
  }

  // sets up the board to show the match replay
  replay():void {
    this.replayStep = 0;
    this.isReplaying = true;
    this.match.turn = 0;
    this.board = new Board('#board', Array(6).fill(Array(7).fill(null)), ()=>{});
  }

  // shows one more move on the replay
  replayFwd(){
    this.board.insertDisk(this.match.moves[this.replayStep], this.match.turn);
    this.match.turn = (this.match.turn + 1) % 2;
    this.replayStep++;

    if (this.replayStep === this.match.moves.length){
      this.isReplaying = false;
      setTimeout(() => {
        this.board.highlightVictory(this.match.winner.positions);
      }, 300 );
    }
  }

  replayBwd(){

  }

  // auto plays the replay until it finishes
  replayAuto(){
    this.isAutoReplaying = true;
    let startStep = this.replayStep;
    let moves = this.match.moves.slice(0);
    moves.splice(startStep).forEach((move) => {
      setTimeout(() => {
        this.board.insertDisk(move, this.match.turn);
        this.match.turn = (this.match.turn + 1) % 2;
      }, 500 * (this.replayStep++ - startStep));
    })

    setTimeout(() => {
      this.board.highlightVictory(this.match.winner.positions);
      this.isReplaying = false;
      this.isAutoReplaying = false;
    }, 500 * (this.replayStep - startStep)-200 );

  }

}
