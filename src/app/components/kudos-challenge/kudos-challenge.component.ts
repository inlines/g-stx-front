import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { KudosScore, KudosService } from '@app/services/kudos.service';
import { finalize } from 'rxjs';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { KudosComponent } from '../kudos/kudos.component';
@Component({
  selector: 'app-kudos-challenge',
  imports: [RouterLink, UserAvatarComponent, KudosComponent],
  templateUrl: './kudos-challenge.component.html',
  styleUrl: './kudos-challenge.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class KudosChallengeComponent implements OnInit {
  private readonly api = inject(KudosService);
  private readonly destroy = inject(DestroyRef);
  items: KudosScore[] = [];
  loading = false;
  error = false;
  ngOnInit() {
    this.load();
  }
  load() {
    if (this.loading) return;
    this.loading = true;
    this.error = false;
    this.api
      .challenge()
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (items) => (this.items = items),
        error: () => (this.error = true),
      });
  }
}
