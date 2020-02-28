import {Component, Input, OnInit} from '@angular/core';
import {forkJoin, Observable} from 'rxjs';
import {ResponseResultModel} from '../../../../@core/net/response-result.model';
import {listToTree, TreeNode} from '../../../../@core/util/tree-node';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {abstractValidate} from '../../../../@core/util/custom-validators';
import {NzModalRef} from 'ng-zorro-antd';
import {GlobalConstants} from '../../../../@core/constant/GlobalConstants';
import {ApplicationService} from '../application.service';
import { ApplicationModel } from '../application.model';

@Component({
  selector: 'app-application-edit',
  templateUrl: './application-edit.component.html',
  styleUrls: ['./application-edit.component.scss']
})
export class ApplicationEditComponent implements OnInit {

  /**
   * 全局常量
   */
  global: GlobalConstants = GlobalConstants.getInstance();
  /**
   * 请求
   */
  request: (params: any) => Observable<any>;
  /**
   * 模块ID
   */
  @Input() id: string;
  /**
   * 编辑表单
   */
  editForm: FormGroup;
  /**
   * 上级下拉框
   */
  applications: TreeNode[] = [];

  constructor(private modal: NzModalRef,
              private fb: FormBuilder,
              private applicationService: ApplicationService) { }

  ngOnInit() {
    //  初始化上级下拉框，角色下拉框
    const applicationReq = this.applicationService.listAll();
    // 发出请求
    forkJoin([applicationReq])
      .subscribe((results: ResponseResultModel[]) => {
        const applicationRes = results[0];

        this.applications = listToTree(applicationRes.result.list);
        // 所有需加载的资源都已加载完成，初始化表单
        if (this.id !== this.global.INSERT_FLAG) {
          this.initUpdate();
        } else {
          this.initSave();
        }
      });

    // 表单验证
    this.editForm = this.fb.group({
      id: [null],
      code: [null, Validators.compose([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ])],
      name: [null, Validators.required],
      type: [null, Validators.required],
      icon: [null],
      url: [null],
      sort: [null, Validators.required],
      isActive: [null, Validators.required],
      parentId: [null],
      remark: [null, Validators.maxLength(250)]
    });
  }

  /**
   * 上级下拉框的值发生变更时触发
   *
   * @param $event
   */
  onChange($event: string): void {
    console.log($event);

  }

  /**
   * 新增表单初始化
   */
  initSave() {
    // 初始化请求方法
    this.request = (params): Observable<any> => {
      return this.applicationService.save(params);
    };
    // 添加异步验证，验证code是否存在，错误标识 existing
    this.editForm.get('code').setAsyncValidators(abstractValidate((code: string) => {
      return this.applicationService.checkCode(code);
    }));
    // 表单重置
    this.editForm.reset({
      id: null,
      code: null,
      name: null,
      type: this.global.APPLICATION_SERVICE,
      icon: null,
      url: null,
      sort: null,
      isActive: this.global.ACTIVE_ON,
      parentId: this.global.ROOT_PARENT_ID,
      remark: null
    });
    this.editForm.get('code').enable();
  }

  /**
   * 初始化更新
   */
  initUpdate() {
    // 初始化请求方法
    this.request = (params): Observable<any> => {
      return this.applicationService.update(params);
    };
    // 获取模块信息初始化表单
    this.applicationService.getById(this.id)
      .subscribe((res: ResponseResultModel) => {
        const model: ApplicationModel = res.result;
        this.editForm.get('code').clearAsyncValidators();
        // 表单重置
        this.editForm.reset({
          id: model.id,
          code: model.code,
          name: model.name,
          type: model.type,
          icon: model.icon,
          url: model.url,
          sort: model.sort,
          isActive: model.isActive,
          parentId: model.parentId,
          remark: model.remark
        });
        this.editForm.get('code').disable();
      });
  }

  /**
   * 表单提交
   */
  submitForm() {
    for (const key of Object.keys(this.editForm.controls)) {
      this.editForm.controls[key].markAsDirty();
      this.editForm.controls[key].updateValueAndValidity({onlySelf: true});
    }
    if (this.editForm.valid) {
      // 判断上级ID是否为null
      if (this.editForm.get('parentId').value === null) {
        // 如果上级ID为null时，设置为根结点父ID
        this.editForm.get('parentId').setValue(this.global.ROOT_PARENT_ID);
      }
      this.request(this.editForm.value).subscribe((res: ResponseResultModel) => {
        // 清空表单
        this.editForm.reset();
        // 关闭模态框
        this.destroyModal(true);
      });
    }
  }

  /**
   * 销毁（关闭）模态框，并返回结果
   *
   * @param refresh 是否刷新，默认为不刷新
   */
  destroyModal(refresh: boolean = false) {
    this.modal.destroy({refresh: refresh});
  }

}