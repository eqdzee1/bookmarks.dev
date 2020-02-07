import { Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Bookmark } from '../core/model/bookmark';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { PublicBookmarksStore } from '../public/bookmarks/store/public-bookmarks-store.service';
import { UserData } from '../core/model/user-data';
import { UserDataStore } from '../core/user/userdata.store';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { DeleteBookmarkDialogComponent } from './delete-bookmark-dialog/delete-bookmark-dialog.component';
import { LoginRequiredDialogComponent } from './login-required-dialog/login-required-dialog.component';
import { PersonalBookmarksService } from '../core/personal-bookmarks.service';
import { SocialShareDialogComponent } from './social-share-dialog/social-share-dialog.component';
import { UserInfoStore } from '../core/user/user-info.store';
import { PlayYoutubeVideoDialogComponent } from './play-youtube-video-dialog/play-youtube-video-dialog.component';
import { MyBookmarksStore } from '../core/user/my-bookmarks.store';

@Component({
  selector: 'app-async-bookmark-list',
  templateUrl: './async-bookmark-list.component.html',
  styleUrls: ['./async-bookmark-list.component.scss']
})
export class AsyncBookmarkListComponent implements OnInit {


  @Input()
  bookmarks: Observable<Bookmark[]>;

  @Input()
  queryText: string;

  @Input()
  userData$: Observable<UserData>;

  @Output()
  bookmarkDeleted = new EventEmitter<boolean>();

  private router: Router;
  private userDataStore: UserDataStore;
  private myBookmarksStore: MyBookmarksStore;
  private publicBookmarksStore: PublicBookmarksStore;
  private personalBookmarksService: PersonalBookmarksService;
  private keycloakService: KeycloakService;
  private userInfoStore: UserInfoStore;

  userId: string;
  userIsLoggedIn = false;

  private _shownSize = 30; // default value if not provided as input

  public innerWidth: any;

  @Input()
  set shownSize(shownSize: number) {
    this._shownSize = shownSize;
  }

  get shownSize(): number {
    return this._shownSize;
  }

  constructor(
    private injector: Injector,
    private deleteDialog: MatDialog,
    private loginDialog: MatDialog,
  ) {
    this.router = <Router>this.injector.get(Router);
    this.publicBookmarksStore = <PublicBookmarksStore>this.injector.get(PublicBookmarksStore);
    this.keycloakService = <KeycloakService>this.injector.get(KeycloakService);
    this.personalBookmarksService = <PersonalBookmarksService>this.injector.get(PersonalBookmarksService);
    this.userInfoStore = <UserInfoStore>this.injector.get(UserInfoStore);
    this.userDataStore = <UserDataStore>this.injector.get(UserDataStore);
    this.myBookmarksStore = <MyBookmarksStore>this.injector.get(MyBookmarksStore);
  }

  ngOnInit(): void {
    this.innerWidth = window.innerWidth;
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userId = userInfo.sub;
        });
      }
    });
  }

  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    const link = ['./personal/bookmarks', bookmark._id];
    this.router.navigate(link, {state: {bookmark: bookmark}});
  }

  likeBookmark(bookmark: Bookmark): void {
    if (!this.userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to like public bookmarks'
      };

      const dialogRef = this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userDataStore.likeBookmark(bookmark);
    }
  }

  unLikeBookmark(bookmark: Bookmark): void {
    this.userDataStore.unLikeBookmark(bookmark);
  }


  onBookmarkLinkClick(bookmark: Bookmark) {
    if (this.userIsLoggedIn) {
      this.userDataStore.addToHistoryAndReadLater$(bookmark, false).subscribe();
      if (this.userId === bookmark.userId) {
        this.personalBookmarksService.increaseOwnerVisitCount(bookmark).subscribe();
      }
    }
  }

  addToPinned(bookmark: Bookmark) {
    if (!this.userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to pin bookmarks'
      };

      const dialogRef = this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userDataStore.addToPinnedBookmarks(bookmark);
    }

  }

  removeFromPinned(bookmark: Bookmark) {
    this.userDataStore.removeFromPinnedBookmarks(bookmark);
  }

  addToReadLater(bookmark: Bookmark) {
    if (!this.userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to add bookmarks to "Read Later"'
      };

      const dialogRef = this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userDataStore.addToLaterReads(bookmark);
    }
  }

  removeFromReadLater(bookmark: Bookmark) {
    this.userDataStore.removeFromLaterReads(bookmark);
  }

  addToFavorites(bookmark: Bookmark) {
    if (!this.userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to add bookmarks to "Favorites"'
      };

      const dialogRef = this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userDataStore.addToFavoriteBookmarks(bookmark);
    }
  }

  removeFromFavorites(bookmark: Bookmark) {
    this.userDataStore.removeFromFavoriteBookmarks(bookmark);
  }


  playYoutubeVideo(bookmark: Bookmark) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;

    let relativeWidth = (this.innerWidth * 80) / 100; // take up to 80% of the screen size
    if (this.innerWidth > 1500) {
      relativeWidth = (1500 * 80) / 100;
    } else {
      relativeWidth = (this.innerWidth * 80) / 100;
    }

    const relativeHeight = (relativeWidth * 9) / 16 + 120; // 16:9 to which we add 120 px for the dialog action buttons ("close")
    dialogConfig.width = relativeWidth + 'px';
    dialogConfig.height = relativeHeight + 'px';

    dialogConfig.data = {
      bookmark: bookmark,
    };

    const dialogRef = this.deleteDialog.open(PlayYoutubeVideoDialogComponent, dialogConfig);
  }

  openDeleteDialog(bookmark: Bookmark) {

    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      bookmark: bookmark,
      userData$: this.userData$
    };

    const dialogRef = this.deleteDialog.open(DeleteBookmarkDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        console.log('Dialog output:', data);
        if (data === 'DELETE_CONFIRMED') {
          this.deleteBookmark(bookmark);
        }
      }
    );
  }

  deleteBookmark(bookmark: Bookmark): void {
    this.personalBookmarksService.deleteBookmark(bookmark).subscribe(() => {
      this.bookmarkDeleted.emit(true);
      this.publicBookmarksStore.removeBookmarkFromPublicStore(bookmark);
      this.userDataStore.removeFromStoresAtDeletion(bookmark);
      this.myBookmarksStore.removeFromStoresAtDeletion(bookmark);
    });
  }

  shareBookmark(bookmark: Bookmark) {

    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.minWidth = 380;
    dialogConfig.data = {
      bookmark: bookmark,
    };

    const dialogRef = this.deleteDialog.open(SocialShareDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        if (data === 'DELETE_CONFIRMED') {
        }
      }
    );
  }
}