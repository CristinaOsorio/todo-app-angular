
import {
  Component,
  computed,
  effect,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { Task } from '../../models/task.model';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilterType } from '../../enums/filter-types.enums';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  tasks = signal<Task[]>([]);

  task = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.pattern(/^(?!\s)(.*)(?<!\s)$/),
    ],
  });

  filter = signal<FilterType>(FilterType.all);
  filterType = FilterType;

  tasksByFilter = computed(() => {
    const filter = this.filter();
    const tasks = this.tasks();

    if (filter === FilterType.pending) {
      return tasks.filter((task) => !task.completed);
    }

    if (filter === FilterType.completed) {
      return tasks.filter((task) => task.completed);
    }

    return tasks;
  });

  injector = inject(Injector);

  constructor() {}

  ngOnInit(): void {
    const storage = localStorage.getItem('tasks');
    if (storage) {
      const tasks = JSON.parse(storage);
      this.tasks.set(tasks);
    }
    this.trackTasks();
  }

  trackTasks() {
    effect(
      () => {
        const tasks = this.tasks();
        localStorage.setItem('tasks', JSON.stringify(tasks));
      },
      { injector: this.injector }
    );
  }

  addTask() {
    if (this.task.valid) {
      const newTask = {
        id: Date.now(),
        title: this.task.value,
        completed: false,
        editing: false,
      };

      this.tasks.update((tasks) => [...tasks, newTask]);
      this.task.setValue('');
    }
  }

  delete(index: number) {
    this.tasks.update((tasks) =>
      tasks.filter((task, position) => position !== index)
    );
  }

  markCompleted(index: number) {
    this.tasks.update((tasks) => {
      return tasks.map((task, position) =>
        position === index
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      );
    });
  }

  edit(index: number) {
    this.tasks.update((tasks) =>
      tasks.map((task, position) =>
        position === index
          ? { ...task, editing: true }
          : { ...task, editing: false }
      )
    );
  }

  updateTask(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const title = input.value.trim();
    this.tasks.update((tasks) =>
      tasks.map((task, position) =>
        position === index
          ? {
              ...task,
              title,
              editing: false,
            }
          : task
      )
    );
    this.task.setValue('');
  }

  changeFilter(filter: FilterType) {
    this.filter.set(filter);
  }

  clearCompletedTasks() {
    this.tasks.update((tasks) => tasks.filter((task) => !task.completed));
  }
}
