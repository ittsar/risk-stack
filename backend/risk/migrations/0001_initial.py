from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Framework',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=150)),
                ('description', models.TextField(blank=True)),
            ],
            options={'ordering': ['code'],},
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=150, unique=True)),
                ('description', models.TextField(blank=True)),
                ('owner', models.CharField(blank=True, max_length=150)),
                ('status', models.CharField(choices=[('planning', 'Planning'), ('active', 'Active'), ('paused', 'Paused'), ('closed', 'Closed')], default='planning', max_length=25)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('target_end_date', models.DateField(blank=True, null=True)),
            ],
            options={'ordering': ['name'],},
        ),
        migrations.CreateModel(
            name='Control',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('reference_id', models.CharField(max_length=100, unique=True)),
                ('name', models.CharField(max_length=150)),
                ('description', models.TextField(blank=True)),
            ],
            options={'ordering': ['reference_id'],},
        ),
        migrations.CreateModel(
            name='Asset',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=150)),
                ('asset_type', models.CharField(choices=[('application', 'Application'), ('infrastructure', 'Infrastructure'), ('vendor', 'Vendor'), ('process', 'Process'), ('data', 'Data')], default='application', max_length=50)),
                ('description', models.TextField(blank=True)),
                ('business_owner', models.CharField(blank=True, max_length=150)),
                ('criticality', models.CharField(blank=True, max_length=50)),
                ('project', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assets', to='risk.project')),
            ],
            options={'ordering': ['name'],},
        ),
        migrations.CreateModel(
            name='Risk',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('identified', 'Identified'), ('analyzing', 'Analyzing'), ('mitigating', 'Mitigating'), ('accepted', 'Accepted'), ('closed', 'Closed')], default='identified', max_length=25)),
                ('owner', models.CharField(blank=True, max_length=150)),
                ('likelihood', models.PositiveSmallIntegerField(choices=[(1, 'Very Low'), (2, 'Low'), (3, 'Medium'), (4, 'High'), (5, 'Very High')], default=3)),
                ('impact', models.PositiveSmallIntegerField(choices=[(1, 'Very Low'), (2, 'Low'), (3, 'Medium'), (4, 'High'), (5, 'Very High')], default=3)),
                ('mitigation_plan', models.TextField(blank=True)),
                ('target_resolution_date', models.DateField(blank=True, null=True)),
                ('project', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='risks', to='risk.project')),
            ],
            options={'ordering': ['-updated_at'],},
        ),
        migrations.CreateModel(
            name='Finding',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('open', 'Open'), ('in_progress', 'In Progress'), ('resolved', 'Resolved'), ('closed', 'Closed')], default='open', max_length=25)),
                ('due_date', models.DateField(blank=True, null=True)),
                ('owner', models.CharField(blank=True, max_length=150)),
                ('risk', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='findings', to='risk.risk')),
            ],
            options={'ordering': ['-due_date'],},
        ),
        migrations.AddField(
            model_name='risk',
            name='assets',
            field=models.ManyToManyField(blank=True, related_name='risks', to='risk.asset'),
        ),
        migrations.AddField(
            model_name='risk',
            name='controls',
            field=models.ManyToManyField(blank=True, related_name='risks', to='risk.control'),
        ),
        migrations.AddField(
            model_name='risk',
            name='frameworks',
            field=models.ManyToManyField(blank=True, related_name='risks', to='risk.framework'),
        ),
        migrations.AddField(
            model_name='control',
            name='frameworks',
            field=models.ManyToManyField(blank=True, related_name='controls', to='risk.framework'),
        ),
        migrations.AlterUniqueTogether(
            name='asset',
            unique_together={('name', 'project')},
        ),
    ]
